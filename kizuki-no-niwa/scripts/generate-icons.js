const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets', 'images');
const svgSource = fs.readFileSync(path.join(ASSETS, 'icon.svg'));

// メインアイコン (iOS, 1024x1024)
const iconSvg = svgSource.toString();

// Androidアダプティブ用フォアグラウンド (透過背景)
const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <path d="M 290 718 C 370 706 450 710 512 712 C 574 710 654 706 734 718"
        stroke="#2D2D2D" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M 512 712 C 511 678 510 638 511 590 C 512 558 513 522 512 458"
        stroke="#2D2D2D" stroke-width="17" fill="none" stroke-linecap="round"/>
  <path d="M 511 600 C 478 572 432 550 400 562 C 383 578 396 603 511 610 Z"
        fill="#2D2D2D"/>
  <path d="M 511 605 C 475 588 442 572 406 565"
        stroke="#F5F5F0" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.45"/>
  <path d="M 512 528 C 548 496 592 478 622 490 C 636 508 622 530 512 536 Z"
        fill="#2D2D2D"/>
  <path d="M 512 532 C 546 516 580 499 618 493"
        stroke="#F5F5F0" stroke-width="2.2" fill="none" stroke-linecap="round" opacity="0.45"/>
  <ellipse cx="512" cy="445" rx="9" ry="15" fill="#2D2D2D" transform="rotate(-3 512 445)"/>
  <circle cx="410" cy="732" r="6"  fill="#8E8E93" opacity="0.65"/>
  <circle cx="458" cy="736" r="4.5" fill="#8E8E93" opacity="0.55"/>
  <circle cx="512" cy="737" r="5"  fill="#8E8E93" opacity="0.65"/>
  <circle cx="558" cy="736" r="4.5" fill="#8E8E93" opacity="0.55"/>
  <circle cx="606" cy="732" r="6"  fill="#8E8E93" opacity="0.65"/>
</svg>`;

// モノクロ (Android monochrome)
const monochromeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <rect width="1024" height="1024" fill="white"/>
  <path d="M 290 718 C 370 706 450 710 512 712 C 574 710 654 706 734 718"
        stroke="black" stroke-width="13" fill="none" stroke-linecap="round"/>
  <path d="M 512 712 C 511 678 510 638 511 590 C 512 558 513 522 512 458"
        stroke="black" stroke-width="17" fill="none" stroke-linecap="round"/>
  <path d="M 511 600 C 478 572 432 550 400 562 C 383 578 396 603 511 610 Z"
        fill="black"/>
  <path d="M 512 528 C 548 496 592 478 622 490 C 636 508 622 530 512 536 Z"
        fill="black"/>
  <ellipse cx="512" cy="445" rx="9" ry="15" fill="black" transform="rotate(-3 512 445)"/>
  <circle cx="410" cy="732" r="6"  fill="#666"/>
  <circle cx="458" cy="736" r="4.5" fill="#666"/>
  <circle cx="512" cy="737" r="5"  fill="#666"/>
  <circle cx="558" cy="736" r="4.5" fill="#666"/>
  <circle cx="606" cy="732" r="6"  fill="#666"/>
</svg>`;

// スプラッシュ用 (シンプル、余白多め)
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <path d="M 145 359 C 185 353 225 355 256 356 C 287 355 327 353 367 359"
        stroke="#2D2D2D" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M 256 356 C 255 339 255 319 256 295 C 257 279 257 261 256 229"
        stroke="#2D2D2D" stroke-width="8.5" fill="none" stroke-linecap="round"/>
  <path d="M 256 300 C 239 286 216 275 200 281 C 192 289 198 301 256 305 Z"
        fill="#2D2D2D"/>
  <path d="M 256 264 C 274 248 296 239 311 245 C 318 254 311 265 256 268 Z"
        fill="#2D2D2D"/>
  <ellipse cx="256" cy="222" rx="4.5" ry="7.5" fill="#2D2D2D" transform="rotate(-3 256 222)"/>
  <circle cx="205" cy="366" r="3"   fill="#8E8E93" opacity="0.65"/>
  <circle cx="229" cy="368" r="2.5" fill="#8E8E93" opacity="0.55"/>
  <circle cx="256" cy="369" r="2.5" fill="#8E8E93" opacity="0.65"/>
  <circle cx="279" cy="368" r="2.5" fill="#8E8E93" opacity="0.55"/>
  <circle cx="303" cy="366" r="3"   fill="#8E8E93" opacity="0.65"/>
</svg>`;

async function generate() {
    console.log('🌱 気づきの庭 — アイコン生成中...');

    // icon.png (1024x1024)
    await sharp(Buffer.from(iconSvg))
        .resize(1024, 1024)
        .png()
        .toFile(path.join(ASSETS, 'icon.png'));
    console.log('✓ icon.png');

    // favicon.png (64x64)
    await sharp(Buffer.from(iconSvg))
        .resize(64, 64)
        .png()
        .toFile(path.join(ASSETS, 'favicon.png'));
    console.log('✓ favicon.png');

    // splash-icon.png (512x512)
    await sharp(Buffer.from(splashSvg))
        .resize(512, 512)
        .png()
        .toFile(path.join(ASSETS, 'splash-icon.png'));
    console.log('✓ splash-icon.png');

    // android-icon-foreground.png (1024x1024, transparent)
    await sharp(Buffer.from(foregroundSvg))
        .resize(1024, 1024)
        .png()
        .toFile(path.join(ASSETS, 'android-icon-foreground.png'));
    console.log('✓ android-icon-foreground.png');

    // android-icon-background.png (1024x1024, solid washi color)
    await sharp({
        create: { width: 1024, height: 1024, channels: 3, background: { r: 245, g: 245, b: 240 } }
    })
        .png()
        .toFile(path.join(ASSETS, 'android-icon-background.png'));
    console.log('✓ android-icon-background.png');

    // android-icon-monochrome.png (1024x1024)
    await sharp(Buffer.from(monochromeSvg))
        .resize(1024, 1024)
        .png()
        .toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
    console.log('✓ android-icon-monochrome.png');

    console.log('\n✅ 全アイコン生成完了!');
}

generate().catch(console.error);
