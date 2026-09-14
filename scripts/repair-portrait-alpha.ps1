param(
  [string]$Cutout = "src/assets/images/hero-portrait-lawrance-transparent.png",
  [string]$Original = "src/assets/images/hero-portrait-lawrance.jpg",
  [string]$Output = "src/assets/images/hero-portrait-lawrance-transparent-v3.png"
)

Add-Type -AssemblyName System.Drawing
$cutoutBitmap = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Cutout))
$originalBitmap = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Original))
$result = New-Object System.Drawing.Bitmap($cutoutBitmap.Width, $cutoutBitmap.Height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

try {
  for ($y = 0; $y -lt $cutoutBitmap.Height; $y++) {
    $left = $cutoutBitmap.Width
    $right = -1
    for ($x = 0; $x -lt $cutoutBitmap.Width; $x++) {
      if ($cutoutBitmap.GetPixel($x, $y).A -ge 245) {
        if ($x -lt $left) { $left = $x }
        $right = $x
      }
    }

    for ($x = 0; $x -lt $cutoutBitmap.Width; $x++) { $result.SetPixel($x, $y, $cutoutBitmap.GetPixel($x, $y)) }

    if ($y -ge 720 -and $right -gt $left) {
      $x = $left + 6
      while ($x -lt ($right - 5)) {
        if ($cutoutBitmap.GetPixel($x, $y).A -ge 245) { $x++; continue }
        $segmentStart = $x
        while ($x -lt ($right - 5) -and $cutoutBitmap.GetPixel($x, $y).A -lt 245) { $x++ }
        $segmentEnd = $x - 1
        $leftPixel = $cutoutBitmap.GetPixel($segmentStart - 1, $y)
        $rightPixel = $cutoutBitmap.GetPixel($segmentEnd + 1, $y)
        $leftLuminance = (0.2126 * $leftPixel.R) + (0.7152 * $leftPixel.G) + (0.0722 * $leftPixel.B)
        $rightLuminance = (0.2126 * $rightPixel.R) + (0.7152 * $rightPixel.G) + (0.0722 * $rightPixel.B)
        $useLeft = $leftLuminance -lt $rightLuminance
        $suitLuminance = if ($useLeft) { $leftLuminance } else { $rightLuminance }
        if ($suitLuminance -lt 105) {
          for ($fillX = $segmentStart; $fillX -le $segmentEnd; $fillX++) {
            $shade = [Math]::Max(17, [Math]::Min(31, 22 + [int](($y - 720) / 130)))
            $result.SetPixel($fillX, $y, [System.Drawing.Color]::FromArgb(255, $shade, $shade + 1, $shade + 4))
          }
        }
      }
    }
  }
  $result.Save((Join-Path (Get-Location) $Output), [System.Drawing.Imaging.ImageFormat]::Png)
}
finally {
  $cutoutBitmap.Dispose()
  $originalBitmap.Dispose()
  $result.Dispose()
}
