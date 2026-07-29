import {
  mkdir,
  readdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const publicRoot = path.join(process.cwd(), "public");
const socialRoot = path.join(publicRoot, "social");

const groups = [
  {
    name: "characters",
    sourceDirectory: path.join(publicRoot, "characters"),
    width: 800,
    height: 800,
    fit: "cover",
  },
  {
    name: "works",
    sourceDirectory: path.join(publicRoot, "works"),
    width: 1200,
    height: 630,
    fit: "cover",
  },
  {
    name: "interviews",
    sourceDirectory: path.join(publicRoot, "interviews"),
    width: 1200,
    height: 630,
    fit: "cover",
  },
];

const supportedExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

function stableHash(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function escapeXml(value) {
  return value.replace(
    /[&<>"']/g,
    (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&apos;",
    })[character] || character,
  );
}

async function listImages(directory) {
  try {
    const entries = await readdir(directory, {
      withFileTypes: true,
    });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        files.push(...await listImages(fullPath));
        continue;
      }

      if (
        entry.isFile()
        && supportedExtensions.has(
          path.extname(entry.name).toLowerCase(),
        )
      ) {
        files.push(fullPath);
      }
    }

    return files;
  } catch (error) {
    if (
      error
      && typeof error === "object"
      && "code" in error
      && error.code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }
}

function getPublicUrl(filePath) {
  const relative = path.relative(publicRoot, filePath)
    .split(path.sep)
    .join("/");
  return `/${relative}`;
}

async function createFallback({
  label,
  fileName,
  width,
  height,
}) {
  const safeLabel = escapeXml(label.toUpperCase());
  const safeName = escapeXml(fileName);
  const titleSize = width === height ? 50 : 42;
  const svg = `
    <svg width="${width}" height="${height}"
      viewBox="0 0 ${width} ${height}"
      xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}"
        fill="#111116"/>
      <rect width="${width}" height="16"
        fill="#c59a38"/>
      <text x="54" y="90" fill="#c59a38"
        font-family="Arial, sans-serif"
        font-size="22" font-weight="700"
        letter-spacing="6">${safeLabel}</text>
      <text x="54" y="${Math.round(height / 2)}"
        fill="#fffef9"
        font-family="Arial, sans-serif"
        font-size="${titleSize}"
        font-weight="700">${safeName}</text>
      <text x="54" y="${height - 52}"
        fill="#fffef9"
        font-family="Arial, sans-serif"
        font-size="20" font-weight="700"
        letter-spacing="4">DAVID TENNANT ARCHIVE</text>
    </svg>
  `;

  return sharp(Buffer.from(svg))
    .jpeg({
      quality: 88,
      progressive: true,
    })
    .toBuffer();
}

async function normalizeImage(filePath, group) {
  const publicUrl = getPublicUrl(filePath);
  const outputDirectory = path.join(
    socialRoot,
    group.name,
  );
  const outputPath = path.join(
    outputDirectory,
    `${stableHash(publicUrl)}.jpg`,
  );

  await mkdir(outputDirectory, {
    recursive: true,
  });

  let output;
  try {
    const source = await readFile(filePath);
    output = await sharp(source, {
      failOn: "none",
      limitInputPixels: 268_402_689,
      animated: false,
    })
      .rotate()
      .resize({
        width: group.width,
        height: group.height,
        fit: group.fit,
        position: "centre",
        background: {
          r: 17,
          g: 17,
          b: 22,
        },
      })
      .flatten({
        background: {
          r: 17,
          g: 17,
          b: 22,
        },
      })
      .jpeg({
        quality: 88,
        progressive: true,
      })
      .toBuffer();
  } catch (error) {
    console.warn(
      `[social-card] ${publicUrl}の変換に失敗したため、項目固有の代替画像を生成します。`,
      error instanceof Error ? error.message : error,
    );
    output = await createFallback({
      label: group.name,
      fileName: path.basename(
        filePath,
        path.extname(filePath),
      ),
      width: group.width,
      height: group.height,
    });
  }

  await writeFile(outputPath, output);
  return publicUrl;
}

await rm(socialRoot, {
  recursive: true,
  force: true,
});

let convertedCount = 0;

for (const group of groups) {
  const files = await listImages(
    group.sourceDirectory,
  );

  for (const filePath of files) {
    await normalizeImage(filePath, group);
    convertedCount += 1;
  }
}

console.log(
  `[social-card] ${convertedCount}件のローカル画像をJPEGへ正規化しました。`,
);
