
import { useEffect, useState } from 'react';
import './GoldStoryLoading.css';

export default function GoldStoryLoading() {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleApiLoading = (event) => {
            setLoading(event.detail?.loading === true);
        };

        window.addEventListener(
            'goldstory:api-loading',
            handleApiLoading
        );

        return () => {
            window.removeEventListener(
                'goldstory:api-loading',
                handleApiLoading
            );
        };
    }, []);

    // Do not render anything if no API request is pending.
    if (!loading) {
        return null;
    }

    return (
        <div className="gs-api-loading-overlay">
            <div className="gs-api-loading-content">

                {/* Rotating Gold Story coin */}
                <div className="gs-api-loading-coin">
                    <svg
                        viewBox="0 0 100 100"
                        className="gs-api-loading-logo"
                    >
                        <defs>
                            <radialGradient
                                id="gsLoadingGold"
                                cx="35%"
                                cy="30%"
                                r="85%"
                            >
                                <stop offset="0%" stopColor="#fff1b8" />
                                <stop offset="40%" stopColor="#f6c744" />
                                <stop offset="80%" stopColor="#d9a021" />
                                <stop offset="100%" stopColor="#a87408" />
                            </radialGradient>

                            <radialGradient
                                id="gsLoadingInnerGold"
                                cx="60%"
                                cy="68%"
                                r="80%"
                            >
                                <stop offset="0%" stopColor="#ffe48a" />
                                <stop offset="100%" stopColor="#d9a021" />
                            </radialGradient>
                        </defs>

                        <circle
                            cx="50"
                            cy="50"
                            r="48"
                            fill="url(#gsLoadingGold)"
                        />

                        <circle
                            cx="50"
                            cy="50"
                            r="46.5"
                            fill="none"
                            stroke="#8a5d00"
                            strokeWidth="1.6"
                            strokeDasharray="1.2 2"
                        />

                        <circle
                            cx="50"
                            cy="50"
                            r="27"
                            fill="url(#gsLoadingInnerGold)"
                            stroke="#9a6a06"
                            strokeWidth="1"
                        />

                        {/* Reuses the Gold Story logo definition */}
                        <svg
                            x="29"
                            y="29"
                            width="42"
                            height="42"
                            viewBox="0 0 40 40"
                            style={{ color: '#5a3c00' }}
                        >
                            <use href="#gsl" />
                        </svg>

                        <defs>
                            <path
                                id="gsLoadingCircleText"
                                d="M50 50m-37 0a37 37 0 1 1 74 0a37 37 0 1 1-74 0"
                            />
                        </defs>

                        <text
                            fontFamily="Montserrat, sans-serif"
                            fontWeight="700"
                            fontSize="7"
                            letterSpacing="1.8"
                            fill="#5a3c00"
                        >
                            <textPath href="#gsLoadingCircleText">
                                THE GOLD STORY • THE GOLD STORY •
                            </textPath>
                        </text>
                    </svg>
                </div>

                {/* Loading message */}
                <div className="gs-api-loading-message">
                    <p className="gs-api-loading-title">
                        Gold Story is loading
                    </p>

                    <p className="gs-api-loading-subtitle">
                        Please wait while we connect...
                    </p>

                    <div className="gs-api-loading-dots">
                        <span />
                        <span />
                        <span />
                    </div>
                </div>

            </div>
        </div>
    );
}
