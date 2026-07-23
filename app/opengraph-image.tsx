import { ImageResponse } from "next/og";

export const alt = "David Tennant Archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * URL共有時に表示するリンクカード画像。
 * 外部画像へ依存せず、SNSやメッセージアプリが安定して取得できるPNGを生成します。
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#111116",
        color: "#fffef9",
        padding: "78px 84px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 auto auto 0",
          width: "100%",
          height: "18px",
          background: "#c59a38",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "-90px",
          top: "-100px",
          width: "460px",
          height: "460px",
          border: "2px solid rgba(197, 154, 56, 0.42)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "35px",
          bottom: "-180px",
          width: "520px",
          height: "520px",
          border: "1px solid rgba(255, 254, 249, 0.18)",
          borderRadius: "50%",
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "22px" }}>
          <div
            style={{
              width: "78px",
              height: "78px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #c59a38",
              color: "#c59a38",
              fontFamily: "Georgia, serif",
              fontSize: "36px",
            }}
          >
            DT
          </div>
          <div style={{ display: "flex", flexDirection: "column", letterSpacing: "5px", fontSize: "18px", fontWeight: 700 }}>
            <span>UNOFFICIAL FAN</span>
            <span>ARCHIVE</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ color: "#c59a38", fontSize: "18px", fontWeight: 700, letterSpacing: "5px", marginBottom: "22px" }}>
            ACTOR · PERFORMER · STORYTELLER
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontFamily: "Georgia, serif", fontSize: "80px", lineHeight: 0.95, fontWeight: 700 }}>
            <span>DAVID TENNANT</span>
            <span>ARCHIVE</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: "18px", color: "#d8d4ca", fontSize: "20px", letterSpacing: "3px" }}>
          <span>WORKS</span><span>·</span><span>CHARACTERS</span><span>·</span><span>INTERVIEWS</span><span>·</span><span>EVENTS</span>
        </div>
      </div>
    </div>,
    size,
  );
}
