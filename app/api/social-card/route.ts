import { createElement } from "react";
import { ImageResponse } from "next/og";
import { getCharacters } from "../../lib/characters";
import {
  findCharacterBySlug,
  findWorkBySlug,
  getCharacterSocialImage,
  getWorkSocialImage,
} from "../../lib/archiveSlugs";
import {
  getMediaLabel,
  getWorkDate,
  getWorks,
} from "../../lib/tmdb";
import {
  getDisplayTitle,
  getOriginalTitle,
  getWorkCharacters,
} from "../../lib/workPresentation";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL
  || "https://david-tennant-site.vercel.app";

export const revalidate = 86400;

function absoluteImageUrl(value: string) {
  try {
    return new URL(value, SITE_URL).toString();
  } catch {
    return new URL("/opengraph-image", SITE_URL).toString();
  }
}

function cardElement({
  image,
  eyebrow,
  title,
  subtitle,
}: {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  const titleSize =
    title.length > 40 ? 42
      : title.length > 28 ? 50
      : title.length > 18 ? 58
      : 68;

  return createElement(
    "div",
    {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        color: "#fffef9",
        background: "#111116",
        fontFamily: "Arial, sans-serif",
      },
    },
    createElement(
      "div",
      {
        style: {
          width: "470px",
          height: "630px",
          display: "flex",
          overflow: "hidden",
          background: "#d9d6cf",
        },
      },
      createElement("img", {
        src: absoluteImageUrl(image),
        alt: "",
        style: {
          width: "470px",
          height: "630px",
          objectFit: "cover",
        },
      }),
    ),
    createElement(
      "div",
      {
        style: {
          width: "730px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "68px 64px 58px",
          background:
            "linear-gradient(135deg, #173d63 0%, #111116 72%)",
        },
      },
      createElement(
        "div",
        {
          style: {
            display: "flex",
            flexDirection: "column",
          },
        },
        createElement(
          "div",
          {
            style: {
              color: "#c9a65b",
              fontSize: "19px",
              fontWeight: 700,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
            },
          },
          eyebrow,
        ),
        createElement(
          "div",
          {
            style: {
              marginTop: "26px",
              fontSize: `${titleSize}px`,
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: "-0.035em",
            },
          },
          title,
        ),
        createElement(
          "div",
          {
            style: {
              marginTop: "28px",
              color: "rgba(255,254,249,.72)",
              fontSize: "25px",
              lineHeight: 1.35,
            },
          },
          subtitle,
        ),
      ),
      createElement(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: "14px",
            color: "#fffef9",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "0.12em",
          },
        },
        createElement(
          "span",
          {
            style: {
              width: "42px",
              height: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px solid #c9a65b",
              color: "#c9a65b",
              fontSize: "17px",
            },
          },
          "DT",
        ),
        "DAVID TENNANT ARCHIVE",
      ),
    ),
  );
}

function missingCard() {
  return cardElement({
    image: "/opengraph-image",
    eyebrow: "DAVID TENNANT ARCHIVE",
    title: "Archive Record",
    subtitle: "The requested record could not be found.",
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const slug = searchParams.get("slug") || "";
  const works = await getWorks();

  if (type === "work") {
    const work = findWorkBySlug(works, slug);
    if (!work) {
      return new ImageResponse(missingCard(), {
        width: 1200,
        height: 630,
      });
    }

    const characters = getWorkCharacters(work);
    const title = getOriginalTitle(work) || getDisplayTitle(work);
    const subtitle = [
      getWorkDate(work).slice(0, 4),
      getMediaLabel(work.media_type),
      characters
        .map((character) => character.englishName || character.name)
        .filter(Boolean)
        .join(" / "),
    ].filter(Boolean).join(" · ");

    return new ImageResponse(
      cardElement({
        image: getWorkSocialImage(work),
        eyebrow: "WORK FILE",
        title,
        subtitle,
      }),
      {
        width: 1200,
        height: 630,
      },
    );
  }

  if (type === "character") {
    const character = findCharacterBySlug(
      getCharacters(works),
      slug,
    );
    if (!character) {
      return new ImageResponse(missingCard(), {
        width: 1200,
        height: 630,
      });
    }

    return new ImageResponse(
      cardElement({
        image: getCharacterSocialImage(character),
        eyebrow: "CHARACTER FILE",
        title: character.englishName || character.name,
        subtitle: `${character.year} · ${character.displayWorkTitle}`,
      }),
      {
        width: 1200,
        height: 630,
      },
    );
  }

  return new ImageResponse(missingCard(), {
    width: 1200,
    height: 630,
  });
}
