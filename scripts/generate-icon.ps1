Add-Type -AssemblyName System.Drawing

function Draw-ClassroomIcon([int]$size) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $g.Clear([System.Drawing.Color]::Transparent)

    [float]$scale = [float]$size / 24.0

    # Draw rounded rectangle background (Blue #2563EB)
    [float]$pad = [float](1.0 * $scale)
    [float]$w = [float]($size - (2.0 * $pad))
    [float]$radius = [float](4.5 * $scale)
    [float]$diameter = [float]($radius * 2.0)

    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc($pad, $pad, $diameter, $diameter, 180, 90)
    $path.AddArc([float]($pad + $w - $diameter), $pad, $diameter, $diameter, 270, 90)
    $path.AddArc([float]($pad + $w - $diameter), [float]($pad + $w - $diameter), $diameter, $diameter, 0, 90)
    $path.AddArc($pad, [float]($pad + $w - $diameter), $diameter, $diameter, 90, 90)
    $path.CloseFigure()

    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 37, 99, 235))
    $g.FillPath($bgBrush, $path)

    # Pen for classroom elements (White)
    [float]$strokeWidth = [Math]::Max([float](1.4 * $scale), 1.2)
    $whitePen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $strokeWidth)
    $whitePen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $whitePen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

    # Blackboard frame (x=4.0, y=4.5, w=16, h=9)
    [float]$bx = [float](4.0 * $scale)
    [float]$by = [float](4.5 * $scale)
    [float]$bw = [float](16.0 * $scale)
    [float]$bh = [float](9.0 * $scale)
    [float]$bRad = [float](1.2 * $scale)
    [float]$bDiam = [float]($bRad * 2.0)

    $bPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $bPath.AddArc($bx, $by, $bDiam, $bDiam, 180, 90)
    $bPath.AddArc([float]($bx + $bw - $bDiam), $by, $bDiam, $bDiam, 270, 90)
    $bPath.AddArc([float]($bx + $bw - $bDiam), [float]($by + $bh - $bDiam), $bDiam, $bDiam, 0, 90)
    $bPath.AddArc($bx, [float]($by + $bh - $bDiam), $bDiam, $bDiam, 90, 90)
    $bPath.CloseFigure()
    $g.DrawPath($whitePen, $bPath)

    # Blackboard content: writing lines
    [float]$thinWidth = [Math]::Max([float](1.0 * $scale), 1.0)
    $thinPen = New-Object System.Drawing.Pen([System.Drawing.Color]::White, $thinWidth)
    $thinPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $thinPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($thinPen, [float](6.5 * $scale), [float](7.5 * $scale), [float](11.0 * $scale), [float](7.5 * $scale))
    $g.DrawLine($thinPen, [float](6.5 * $scale), [float](10.0 * $scale), [float](9.5 * $scale), [float](10.0 * $scale))

    # Chart / geometry on right of board
    $g.DrawLine($thinPen, [float](13.5 * $scale), [float](10.0 * $scale), [float](15.5 * $scale), [float](7.5 * $scale))
    $g.DrawLine($thinPen, [float](15.5 * $scale), [float](7.5 * $scale), [float](17.5 * $scale), [float](10.0 * $scale))

    # Board easel stand legs
    $g.DrawLine($whitePen, [float](6.5 * $scale), [float](13.5 * $scale), [float](6.5 * $scale), [float](19.5 * $scale))
    $g.DrawLine($whitePen, [float](17.5 * $scale), [float](13.5 * $scale), [float](17.5 * $scale), [float](19.5 * $scale))

    # Desk / pupitre in front of blackboard
    $g.DrawLine($whitePen, [float](9.5 * $scale), [float](16.0 * $scale), [float](14.5 * $scale), [float](16.0 * $scale))
    $g.DrawLine($whitePen, [float](10.5 * $scale), [float](16.0 * $scale), [float](10.5 * $scale), [float](19.5 * $scale))
    $g.DrawLine($whitePen, [float](13.5 * $scale), [float](16.0 * $scale), [float](13.5 * $scale), [float](19.5 * $scale))

    $g.Dispose()
    return $bmp
}

$buildDir = "build"
$publicDir = "public"
if (!(Test-Path $buildDir)) { New-Item -ItemType Directory -Path $buildDir | Out-Null }
if (!(Test-Path $publicDir)) { New-Item -ItemType Directory -Path $publicDir | Out-Null }

# Generate high-res 256x256 PNGs
$bmp256 = Draw-ClassroomIcon 256
$bmp256.Save("$buildDir/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp256.Save("$publicDir/icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Generate 32x32 for Window Titlebar and ICO
$bmp32 = Draw-ClassroomIcon 32
$bmp32.Save("$publicDir/icon-32.png", [System.Drawing.Imaging.ImageFormat]::Png)
$hIcon = $bmp32.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream("$buildDir/icon.ico", [System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

Copy-Item "$buildDir/icon.ico" "$publicDir/icon.ico" -Force

Write-Host "SUCCESS: Classroom icons generated in build/ and public/"
