param(
  [Parameter(Mandatory = $true)][string]$InputPath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [string]$ReferenceMask = "src/assets/images/hero-portrait-lawrance-transparent.png"
)

Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies @('System.Drawing', 'System.Runtime.InteropServices') -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

public static class CheckerboardRemoval {
  private static bool IsBackground(byte b, byte g, byte r) {
    int max = Math.Max(r, Math.Max(g, b));
    int min = Math.Min(r, Math.Min(g, b));
    return max - min <= 12 && (r + g + b) / 3 >= 170;
  }

  public static void Run(string inputPath, string outputPath, string referenceMaskPath) {
    using (var source = new Bitmap(inputPath))
    using (var image = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb)) {
      using (Graphics graphics = Graphics.FromImage(image)) graphics.DrawImageUnscaled(source, 0, 0);
      Rectangle rect = new Rectangle(0, 0, image.Width, image.Height);
      BitmapData data = image.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
      int stride = Math.Abs(data.Stride);
      byte[] pixels = new byte[stride * image.Height];
      Marshal.Copy(data.Scan0, pixels, 0, pixels.Length);

      int count = image.Width * image.Height;
      bool[] visited = new bool[count];
      int[] queue = new int[count];
      int head = 0, tail = 0;
      Action<int, int> enqueue = (x, y) => {
        int index = y * image.Width + x;
        if (visited[index]) return;
        int offset = y * stride + x * 4;
        if (!IsBackground(pixels[offset], pixels[offset + 1], pixels[offset + 2])) return;
        visited[index] = true;
        queue[tail++] = index;
      };

      for (int x = 0; x < image.Width; x++) { enqueue(x, 0); enqueue(x, image.Height - 1); }
      for (int y = 0; y < image.Height; y++) { enqueue(0, y); enqueue(image.Width - 1, y); }

      while (head < tail) {
        int index = queue[head++];
        int x = index % image.Width;
        int y = index / image.Width;
        int offset = y * stride + x * 4;
        pixels[offset + 3] = 0;
        if (x > 0) enqueue(x - 1, y);
        if (x + 1 < image.Width) enqueue(x + 1, y);
        if (y > 0) enqueue(x, y - 1);
        if (y + 1 < image.Height) enqueue(x, y + 1);
      }

      // Preserve all foreground pixels the proven original cutout already kept
      // (face, shirt, tie and outer silhouette), while the new mask restores
      // the two dark lapel areas that the original cutout erased.
      using (var reference = new Bitmap(referenceMaskPath)) {
        BitmapData referenceData = reference.LockBits(rect, ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
        int referenceStride = Math.Abs(referenceData.Stride);
        byte[] referencePixels = new byte[referenceStride * reference.Height];
        Marshal.Copy(referenceData.Scan0, referencePixels, 0, referencePixels.Length);
        for (int y = 0; y < image.Height; y++) {
          for (int x = 0; x < image.Width; x++) {
            int offset = y * stride + x * 4;
            int referenceOffset = y * referenceStride + x * 4;
            bool shirtAndTieRegion = y >= 690 && x >= 470 && x <= 810;
            if (shirtAndTieRegion && referencePixels[referenceOffset + 3] > pixels[offset + 3])
              pixels[offset + 3] = referencePixels[referenceOffset + 3];
          }
        }
        reference.UnlockBits(referenceData);
      }

      Marshal.Copy(pixels, 0, data.Scan0, pixels.Length);
      image.UnlockBits(data);
      image.Save(outputPath, ImageFormat.Png);
    }
  }
}
'@

[CheckerboardRemoval]::Run(
  (Resolve-Path $InputPath),
  (Join-Path (Get-Location) $OutputPath),
  (Resolve-Path $ReferenceMask)
)
