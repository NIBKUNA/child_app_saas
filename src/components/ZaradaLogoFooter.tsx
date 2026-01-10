// @ts-nocheck
/* eslint-disable */
/**
 * 🎨 Project: Zarada ERP - The Sovereign Canvas
 * 🛠️ Created by: 안욱빈 (An Uk-bin)
 * 📅 Date: 2026-01-10
 * 🖋️ Description: "코드와 데이터로 세상을 채색하다."
 * ⚠️ Copyright (c) 2026 안욱빈. All rights reserved.
 */

export function ZaradaLogoFooter() {
    return (
        <footer className="w-full py-12 flex items-center justify-center bg-[#f8f8f8]">
            {/* Google Fonts Loader */}
            <link
                href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@700;800&display=swap"
                rel="stylesheet"
            />
            <div className="relative inline-block">
                {/* Green Dot */}
                <div
                    className="absolute rounded-full bg-[#6ABF69]"
                    style={{
                        top: '-24px',
                        right: '18px',
                        width: '12px',
                        height: '12px'
                    }}
                />
                {/* Orange Dot */}
                <div
                    className="absolute rounded-full bg-[#F5A623]"
                    style={{
                        top: '-12px',
                        right: '2px',
                        width: '14px',
                        height: '14px'
                    }}
                />
                {/* Logo Text */}
                <span
                    style={{
                        fontFamily: "'Nanum Gothic', sans-serif",
                        fontSize: '72px',
                        fontWeight: 800,
                        letterSpacing: '2px',
                        background: 'linear-gradient(90deg, #5BC4D4 0%, #6B9FD6 30%, #8B7BBF 60%, #A855A0 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                >
                    자라다
                </span>
            </div>
        </footer>
    );
}
