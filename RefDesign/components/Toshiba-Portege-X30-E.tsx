import '../styles/Toshiba-Portege-X30-E.css';

export const ToshibaPortegeX30E = () => {
    return (
        <div className="keyboard-outer toshiba-portege-x30-e-colors">
            <div className="keyboard">
                <div className="nub-outer">
                    <div className="nub">
                        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200">
                            <defs>
                                <pattern id="dots-tight-staggered" patternUnits="userSpaceOnUse" width="6" height="4">
                                    <circle cx="2" cy="1" r="1" />
                                    <circle cx="5" cy="3" r="1" />
                                </pattern>
                            </defs>

                            <rect width="100%" height="100%" fill="url(#dots-tight-staggered)" />
                        </svg>
                    </div>
                </div>

                <div className="row row-1">
                    <button data-key-name="esc">
                        <span className="key align-left">ESC</span>
                        <span className="fn-key align-right flex gap-1">
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256"
                                height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M154.64,26.61a6,6,0,0,0-6.32.65L77.94,82H32A14,14,0,0,0,18,96v64a14,14,0,0,0,14,14H77.94l70.38,54.74A6,6,0,0,0,158,224V32A6,6,0,0,0,154.64,26.61ZM30,160V96a2,2,0,0,1,2-2H74v68H32A2,2,0,0,1,30,160Zm116,51.73L86,165.07V90.93l60-46.66Zm50.53-108.85a38,38,0,0,1,0,50.24,6,6,0,1,1-9-7.94,26,26,0,0,0,0-34.37,6,6,0,0,1,9-7.93ZM246,128a77.86,77.86,0,0,1-19.86,52,6,6,0,1,1-8.94-8,66,66,0,0,0,0-88,6,6,0,1,1,8.94-8A77.86,77.86,0,0,1,246,128Z">
                                </path>
                            </svg>/<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 256 256"
                                height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M155.51,24.81a8,8,0,0,0-8.42.88L77.25,80H32A16,16,0,0,0,16,96v64a16,16,0,0,0,16,16H77.25l69.84,54.31A8,8,0,0,0,160,224V32A8,8,0,0,0,155.51,24.81ZM32,96H72v64H32ZM144,207.64,88,164.09V91.91l56-43.55Z">
                                </path>
                            </svg>
                        </span>
                    </button>

                    <button data-key-name="f1">
                        <span className="key align-left">F1</span>
                        <span className="fn-key align-right">
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512"
                                height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M400 224h-24v-72C376 68.2 307.8 0 224 0S72 68.2 72 152v72H48c-26.5 0-48 21.5-48 48v192c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V272c0-26.5-21.5-48-48-48zm-104 0H152v-72c0-39.7 32.3-72 72-72s72 32.3 72 72v72z">
                                </path>
                            </svg>
                        </span>
                    </button>

                    <button data-key-name="f2">
                        <span className="key align-left">F2</span>
                        <span className="fn-key align-right">
                            <span className="bulb-icon">
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20"
                                    aria-hidden="true" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M10 1a6 6 0 0 0-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 0 0 .572.729 6.016 6.016 0 0 0 2.856 0A.75.75 0 0 0 12 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0 0 10 1ZM8.863 17.414a.75.75 0 0 0-.226 1.483 9.066 9.066 0 0 0 2.726 0 .75.75 0 0 0-.226-1.483 7.553 7.553 0 0 1-2.274 0Z">
                                    </path>
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button data-key-name="f3">
                        <span className="key align-left">F3</span>
                        <span className="fn-key align-right flex gap-0.5 align-center">
                            <span className="arrow-right-icon">
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20"
                                    aria-hidden="true" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd"
                                        d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                                        clipRule="evenodd"></path>
                                </svg>
                            </span>

                            <span className="microchip-icon">
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M16 2H8c-1.103 0-2 .897-2 2v16c0 1.103.897 2 2 2h8c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM8 20V4h8l.001 16H8zM3 7h2V5H3v.5H2v1h1zm18-2h-2v2h2v-.5h1v-1h-1zM3 11h2V9H3v.5H2v1h1zm18-2h-2v2h2v-.5h1v-1h-1zM3 15h2v-2H3v.5H2v1h1zm18-2h-2v2h2v-.5h1v-1h-1zM3 19h2v-2H3v.5H2v1h1zm18-2h-2v2h2v-.5h1v-1h-1z">
                                    </path>
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button data-key-name="f4">
                        <span className="key align-left">F4</span>
                        <span className="fn-key align-right flex gap-1">
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true"
                                height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z">
                                </path>
                            </svg>/<svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24"
                                strokeLinecap="round" strokeLinejoin="round" height="16px" width="16px"
                                xmlns="http://www.w3.org/2000/svg">
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                                <line x1="12" y1="19" x2="12" y2="23"></line>
                                <line x1="8" y1="23" x2="16" y2="23"></line>
                            </svg>
                        </span>
                    </button>

                    <button data-key-name="f5">
                        <span className="key align-left">F5</span>
                        <span className="fn-key align-right flex gap-1">
                            <span className="laptop-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 172.05 141.51" fill="none"
                                    stroke="currentColor" color="currentColor">
                                    <rect x="25.17" y="4.5" width="122.15" height="80.67" strokeWidth="9"
                                        strokeMiterlimit="10" />

                                    <rect x="63.91" y="1.76" width="44.67" height="86.15" rx="5.01" ry="5.01"
                                        transform="translate(131.08 -41.41) rotate(90)" strokeWidth="9"
                                        strokeMiterlimit="10" />

                                    <polygon points="25.17 97.32 7.01 137.01 165.1 137.01 147.32 97.32 25.17 97.32"
                                        strokeWidth="9" strokeMiterlimit="10" />
                                </svg>
                            </span>/<svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24"
                                height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                <path fill="none" d="M0 0h24v24H0V0z"></path>
                                <path
                                    d="M12 6c2.45 0 4.71.2 7.29.64.47 1.78.71 3.58.71 5.36s-.24 3.58-.71 5.36c-2.58.44-4.84.64-7.29.64s-4.71-.2-7.29-.64C4.24 15.58 4 13.78 4 12s.24-3.58.71-5.36C7.29 6.2 9.55 6 12 6m0-2c-2.73 0-5.22.24-7.95.72l-.93.16-.25.9C2.29 7.85 2 9.93 2 12s.29 4.15.87 6.22l.25.89.93.16c2.73.49 5.22.73 7.95.73s5.22-.24 7.95-.72l.93-.16.25-.89c.58-2.08.87-4.16.87-6.23s-.29-4.15-.87-6.22l-.25-.89-.93-.16C17.22 4.24 14.73 4 12 4z">
                                </path>
                            </svg>
                        </span>
                    </button>

                    <button data-key-name="f6">
                        <span className="key align-left">F6</span>
                        <span className="fn-key align-right align-brightness">
                            <span className="triangle-icon">
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M11.646 15.146 5.854 9.354a.5.5 0 0 1 .353-.854h11.586a.5.5 0 0 1 .353.854l-5.793 5.792a.5.5 0 0 1-.707 0Z">
                                    </path>
                                </svg>
                            </span>
                            <span>
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm0-1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 1 0 0 11Zm-5.657.157a.75.75 0 0 1 0 1.06l-1.768 1.768a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.767-1.768a.75.75 0 0 1 1.061 0ZM3.515 3.515a.75.75 0 0 1 1.06 0l1.768 1.768a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L3.515 4.575a.75.75 0 0 1 0-1.06ZM12 0a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 12 0ZM4 12a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h2.5A.75.75 0 0 1 4 12Zm8 8a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 12 20Zm12-8a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h2.5A.75.75 0 0 1 24 12Zm-6.343 5.657a.75.75 0 0 1 1.06 0l1.768 1.768a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-1.768-1.767a.75.75 0 0 1 0-1.061Zm2.828-14.142a.75.75 0 0 1 0 1.06l-1.768 1.768a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l1.767-1.768a.75.75 0 0 1 1.061 0Z">
                                    </path>
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button data-key-name="f7">
                        <span className="key align-left">F7</span>
                        <span className="fn-key align-right align-brightness">
                            <span className="triangle-icon">
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="m12.354 8.854 5.792 5.792a.5.5 0 0 1-.353.854H6.207a.5.5 0 0 1-.353-.854l5.792-5.792a.5.5 0 0 1 .708 0Z">
                                    </path>
                                </svg>
                            </span>

                            <span>
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M12 19a7 7 0 1 1 0-14 7 7 0 0 1 0 14Zm0-1.5a5.5 5.5 0 1 0 0-11 5.5 5.5 0 1 0 0 11Zm-5.657.157a.75.75 0 0 1 0 1.06l-1.768 1.768a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l1.767-1.768a.75.75 0 0 1 1.061 0ZM3.515 3.515a.75.75 0 0 1 1.06 0l1.768 1.768a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215L3.515 4.575a.75.75 0 0 1 0-1.06ZM12 0a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 12 0ZM4 12a.75.75 0 0 1-.75.75H.75a.75.75 0 0 1 0-1.5h2.5A.75.75 0 0 1 4 12Zm8 8a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 12 20Zm12-8a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h2.5A.75.75 0 0 1 24 12Zm-6.343 5.657a.75.75 0 0 1 1.06 0l1.768 1.768a.751.751 0 0 1-.018 1.042.751.751 0 0 1-1.042.018l-1.768-1.767a.75.75 0 0 1 0-1.061Zm2.828-14.142a.75.75 0 0 1 0 1.06l-1.768 1.768a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l1.767-1.768a.75.75 0 0 1 1.061 0Z">
                                    </path>
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button data-key-name="f8">
                        <span className="key align-left">F8</span>
                        <span className="fn-key align-right">
                            <span className="aeroplane-icon">
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M407.7 224c-3.4 0-14.8.1-18 .3l-64.9 1.7c-.7 0-1.4-.3-1.7-.9L225.8 79.4c-2.9-4.6-8.1-7.4-13.5-7.4h-23.7c-5.6 0-7.5 5.6-5.5 10.8l50.1 142.8c.5 1.3-.4 2.7-1.8 2.7L109 230.1c-2.6.1-5-1.1-6.6-3.1l-37-45c-3-3.9-7.7-6.1-12.6-6.1H36c-2.8 0-4.7 2.7-3.8 5.3l19.9 68.7c1.5 3.8 1.5 8.1 0 11.9l-19.9 68.7c-.9 2.6 1 5.3 3.8 5.3h16.7c4.9 0 9.6-2.3 12.6-6.1L103 284c1.6-2 4.1-3.2 6.6-3.1l121.7 2.7c1.4.1 2.3 1.4 1.8 2.7L183 429.2c-2 5.2-.1 10.8 5.5 10.8h23.7c5.5 0 10.6-2.8 13.5-7.4L323.1 287c.4-.6 1-.9 1.7-.9l64.9 1.7c3.3.2 14.6.3 18 .3 44.3 0 72.3-14.3 72.3-32S452.1 224 407.7 224z">
                                    </path>
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button data-key-name="f9">
                        <span className="key align-left">F9</span>
                        <span className="fn-key align-right flex gap-1">
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24"
                                strokeLinecap="round" strokeLinejoin="round" height="16px" width="16px"
                                xmlns="http://www.w3.org/2000/svg">
                                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                                <path d="M2 14h20"></path>
                                <path d="M12 20v-6"></path>
                            </svg>/<svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24"
                                strokeLinecap="round" strokeLinejoin="round" height="16px" width="16px"
                                xmlns="http://www.w3.org/2000/svg">
                                <path d="M4 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16"></path>
                                <path d="M2 14h12"></path>
                                <path d="M22 14h-2"></path>
                                <path d="M12 20v-6"></path>
                                <path d="m2 2 20 20"></path>
                                <path d="M22 16V6a2 2 0 0 0-2-2H10"></path>
                            </svg>
                        </span>
                    </button>

                    <button data-key-name="f10">
                        <span className="key align-left">F10</span>
                        <span className="fn-key align-right">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 158.3 158.3" fill="currentColor"
                                stroke="currentColor" color="currentColor">
                                <rect x="4.15" y="4.15" width="150.01" height="150.01" rx="17.17" ry="17.17" fill="none"
                                    strokeWidth="8.3" strokeMiterlimit="10" />

                                <path
                                    d="M40.95,94.85l-.27-8.96h27.86c1.74,0,3.17-1.43,3.17-3.17v-7.13c0-1.74-1.43-3.17-3.17-3.17h-27.86s.27-8.99.27-8.99c0-4.24-5.12-6.35-8.12-3.35l-15.71,15.71c-1.87,1.87-1.87,4.87,0,6.73l15.71,15.71c2.99,2.99,8.12,.86,8.12-3.38ZM119.12,63.45l.27,8.96h-27.86c-1.74,0-3.17,1.43-3.17,3.17v7.13c0,1.74,1.43,3.17,3.17,3.17h27.86s-.27,8.99-.27,8.99c0,4.24,5.12,6.35,8.12,3.35l15.71-15.71c1.87-1.87,1.87-4.87,0-6.73l-15.71-15.71c-2.99-2.99-8.12-.86-8.12,3.38ZM95.84,118.57l-8.96.27v-27.86c0-1.74-1.43-3.17-3.17-3.17h-7.13c-1.74,0-3.17,1.43-3.17,3.17v27.86s-8.99-.27-8.99-.27c-4.24,0-6.35,5.12-3.35,8.12l15.71,15.71c1.87,1.87,4.87,1.87,6.73,0l15.71-15.71c2.99-2.99.86-8.12-3.38-8.12ZM64.44,39.74l8.96-.27v27.86c0,1.74,1.43,3.17,3.17,3.17h7.13c1.74,0,3.17-1.43,3.17-3.17v-27.86s8.99.27,8.99.27c4.24,0,6.35-5.12,3.35-8.12l-15.71-15.71c-1.87-1.87-4.87-1.87-6.73,0l-15.71,15.71c-2.99,2.99-.86,8.12,3.38,8.12Z" />
                            </svg>
                        </span>
                    </button>

                    <button data-key-name="f11">
                        <span className="key align-left">F11</span>
                        <span className="fn-key align-right">
                            <span className="numpad-icon">
                                <svg stroke="currentColor" fill="none" strokeWidth="0" viewBox="0 0 15 15" height="16px"
                                    width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd" clipRule="evenodd"
                                        d="M2.85714 2H12.1429C12.6162 2 13 2.38376 13 2.85714V12.1429C13 12.6162 12.6162 13 12.1429 13H2.85714C2.38376 13 2 12.6162 2 12.1429V2.85714C2 2.38376 2.38376 2 2.85714 2ZM1 2.85714C1 1.83147 1.83147 1 2.85714 1H12.1429C13.1685 1 14 1.83147 14 2.85714V12.1429C14 13.1685 13.1685 14 12.1429 14H2.85714C1.83147 14 1 13.1685 1 12.1429V2.85714ZM7.49988 5.00012C7.77602 5.00012 7.99988 4.77626 7.99988 4.50012C7.99988 4.22398 7.77602 4.00012 7.49988 4.00012C7.22374 4.00012 6.99988 4.22398 6.99988 4.50012C6.99988 4.77626 7.22374 5.00012 7.49988 5.00012ZM4.49988 11.0001C4.77602 11.0001 4.99988 10.7763 4.99988 10.5001C4.99988 10.224 4.77602 10.0001 4.49988 10.0001C4.22374 10.0001 3.99988 10.224 3.99988 10.5001C3.99988 10.7763 4.22374 11.0001 4.49988 11.0001ZM4.99988 7.50012C4.99988 7.77626 4.77602 8.00012 4.49988 8.00012C4.22374 8.00012 3.99988 7.77626 3.99988 7.50012C3.99988 7.22398 4.22374 7.00012 4.49988 7.00012C4.77602 7.00012 4.99988 7.22398 4.99988 7.50012ZM4.49988 5.00012C4.77602 5.00012 4.99988 4.77626 4.99988 4.50012C4.99988 4.22398 4.77602 4.00012 4.49988 4.00012C4.22374 4.00012 3.99988 4.22398 3.99988 4.50012C3.99988 4.77626 4.22374 5.00012 4.49988 5.00012ZM10.9999 10.5001C10.9999 10.7763 10.776 11.0001 10.4999 11.0001C10.2237 11.0001 9.99988 10.7763 9.99988 10.5001C9.99988 10.224 10.2237 10.0001 10.4999 10.0001C10.776 10.0001 10.9999 10.224 10.9999 10.5001ZM10.4999 8.00012C10.776 8.00012 10.9999 7.77626 10.9999 7.50012C10.9999 7.22398 10.776 7.00012 10.4999 7.00012C10.2237 7.00012 9.99988 7.22398 9.99988 7.50012C9.99988 7.77626 10.2237 8.00012 10.4999 8.00012ZM10.9999 4.50012C10.9999 4.77626 10.776 5.00012 10.4999 5.00012C10.2237 5.00012 9.99988 4.77626 9.99988 4.50012C9.99988 4.22398 10.2237 4.00012 10.4999 4.00012C10.776 4.00012 10.9999 4.22398 10.9999 4.50012ZM7.49988 11.0001C7.77602 11.0001 7.99988 10.7763 7.99988 10.5001C7.99988 10.224 7.77602 10.0001 7.49988 10.0001C7.22374 10.0001 6.99988 10.224 6.99988 10.5001C6.99988 10.7763 7.22374 11.0001 7.49988 11.0001Z"
                                        fill="currentColor"></path>
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button data-key-name="f12">
                        <span className="key align-left">F12</span>
                        <span className="fn-key align-right">
                            <span className="arrow-up-dn-icon">
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 20 20"
                                    aria-hidden="true" height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path fillRule="evenodd"
                                        d="M2.24 6.8a.75.75 0 0 0 1.06-.04l1.95-2.1v8.59a.75.75 0 0 0 1.5 0V4.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0L2.2 5.74a.75.75 0 0 0 .04 1.06Zm8 6.4a.75.75 0 0 0-.04 1.06l3.25 3.5a.75.75 0 0 0 1.1 0l3.25-3.5a.75.75 0 1 0-1.1-1.02l-1.95 2.1V6.75a.75.75 0 0 0-1.5 0v8.59l-1.95-2.1a.75.75 0 0 0-1.06-.04Z"
                                        clipRule="evenodd"></path>
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button data-key-name="prtsc">
                        <span className="key flex flex-col">
                            <span>PRTSC</span>
                            <span>SYSRQ</span>
                        </span>
                    </button>

                    <button data-key-name="home">
                        <span className="key">HOME</span>
                        <span className="fn-key">PAUSE</span>
                    </button>

                    <button data-key-name="end">
                        <span className="key">END</span>
                        <span className="fn-key">BREAK</span>
                    </button>

                    <button data-key-name="ins">
                        <span className="key">INS</span>
                    </button>

                    <button data-key-name="del">
                        <span className="key">DEL</span>
                    </button>
                </div>

                <div className="row row-2">
                    <button className="tilde-key content-between" data-key-name="backtick">
                        <span className="shift-key">~</span>
                        <span className="key">`</span>
                    </button>

                    <button className="content-between" data-key-name="1">
                        <span className="shift-key">!</span>
                        <span className="key">1</span>
                        <span className="fn-key">
                            <span className="zoom-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 146.01 55.22" color="black">
                                    <rect x="2.16" y="2.16" width="141.69" height="50.9" rx="7.67" ry="7.67" fill="none"
                                        stroke="currentColor" strokeWidth="4.32" strokeLinecap="round"
                                        strokeLinejoin="round" />

                                    <path
                                        d="M10.55,44.77V10.46c0-2.38,2.87-3.57,4.55-1.89l17.16,17.16c1.04,1.04,1.04,2.73,0,3.77l-17.16,17.16c-1.68,1.68-4.55.49-4.55-1.89Z"
                                        fill="currentColor" />

                                    <path
                                        d="M136.09,10.46v34.31c0,2.38-2.87,3.57-4.55,1.89l-17.16-17.16c-1.04-1.04-1.04-2.73,0-3.77l17.16-17.16c1.68-1.68,4.55-.49,4.55,1.89Z"
                                        fill="currentColor" />

                                    <circle cx="72.86" cy="29.19" r="17.14" fill="none" stroke="currentColor"
                                        strokeWidth="4.29" strokeLinecap="round" strokeLinejoin="round" />

                                    <line x1="94.29" y1="50.62" x2="84.97" y2="41.3" stroke="currentColor"
                                        strokeWidth="4.29" strokeLinecap="round" strokeLinejoin="round" />

                                    <line x1="66.43" y1="29.19" x2="79.29" y2="29.19" stroke="currentColor"
                                        strokeWidth="4.29" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button className="content-between" data-key-name="2">
                        <span className="shift-key">@</span>
                        <span className="key">2</span>
                        <span className="fn-key">
                            <span className="zoom-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 146.01 55.22" color="black">
                                    <circle cx="73.32" cy="26.88" r="18.68" fill="none" stroke="currentColor"
                                        strokeWidth="4.67" strokeLinecap="round" strokeLinejoin="round" />

                                    <line x1="96.67" y1="50.24" x2="86.51" y2="40.08" stroke="currentColor"
                                        strokeWidth="4.67" strokeLinecap="round" strokeLinejoin="round" />

                                    <line x1="73.32" y1="19.88" x2="73.32" y2="33.89" stroke="currentColor"
                                        strokeWidth="4.67" strokeLinecap="round" strokeLinejoin="round" />

                                    <line x1="66.31" y1="26.88" x2="80.33" y2="26.88" stroke="currentColor"
                                        strokeWidth="4.67" strokeLinecap="round" strokeLinejoin="round" />

                                    <rect x="2.16" y="2.16" width="141.69" height="50.9" rx="7.67" ry="7.67" fill="none"
                                        stroke="currentColor" strokeWidth="4.32" strokeLinecap="round"
                                        strokeLinejoin="round" />

                                    <path
                                        d="M33.04,10.46v34.31c0,2.38-2.87,3.57-4.55,1.89L11.33,29.5c-1.04-1.04-1.04-2.73,0-3.77L28.48,8.57c1.68-1.68,4.55-.49,4.55,1.89Z"
                                        fill="currentColor" />

                                    <path
                                        d="M113.6,44.77V10.46c0-2.38,2.87-3.57,4.55-1.89l17.16,17.16c1.04,1.04,1.04,2.73,0,3.77l-17.16,17.16c-1.68,1.68-4.55.49-4.55-1.89Z"
                                        fill="currentColor" />
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button className="content-between" data-key-name="3">
                        <span className="shift-key">#</span>
                        <span className="key">3</span>
                        <span className="fn-key">
                            <span className="volume-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.72 25.16" color="black">
                                    <g>
                                        <path fill="currentColor"
                                            d="M126.8,22.57c-1.04,2.75-3.54,2.57-8.22,2.59-3.65,0-7.25,0-10.98,0-19.1,0-44.68,0-63.76,0-2.16-.07-6.75.2-5.84-.44C49.63,20.99,103.11,5.94,120.98.68c1.81-.44,3.96-1.27,5.25-.04,1.22.86,1.47,5.83,1.49,9.08-.04,4.99.2,9.42-.88,12.75l-.04.1Z" />

                                        <path fill="currentColor"
                                            d="M28.48,12.58H4.07c-2.25,0-4.07,1.21-4.07,2.69s1.82,2.69,4.07,2.69h24.41c2.25,0,4.07-1.21,4.07-2.69s-1.82-2.69-4.07-2.69Z" />
                                    </g>
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button className="content-between" data-key-name="4">
                        <span className="shift-key">$</span>
                        <span className="key">4</span>
                        <span className="fn-key">
                            <span className="volume-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 131.33 35.32" fill="currentColor"
                                    color="currentColor">
                                    <path
                                        d="M113.67,0c1.01,0,1.83.82,1.83,1.83v14.01h14.01c1.01,0,1.83.82,1.83,1.83s-.82,1.83-1.83,1.83h-14.01v14.01c0,1.01-.82,1.83-1.83,1.83s-1.83-.82-1.83-1.83v-14.01h-14.01c-1.01,0-1.83-.82-1.83-1.83s.82-1.83,1.83-1.83h14.01V1.83c0-1.01.82-1.83,1.83-1.83Z" />

                                    <path
                                        d="M88.93,28.01c-1.04,2.75-3.54,2.57-8.22,2.59-3.65,0-7.25,0-10.98,0-19.1,0-44.68,0-63.76,0-2.16-.07-6.75.2-5.84-.44,11.64-3.73,65.12-18.79,82.99-24.05,1.81-.44,3.96-1.27,5.25-.04,1.22.86,1.47,5.83,1.49,9.08-.04,4.99.2,9.42-.88,12.75l-.04.1Z" />
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button className="no-fn" data-key-name="5">
                        <span className="shift-key">%</span>
                        <span className="key">5</span>
                    </button>

                    <button className="no-fn" data-key-name="6">
                        <span className="shift-key">^</span>
                        <span className="key">6</span>
                    </button>

                    <button className="content-between" data-key-name="7">
                        <span className="shift-key">&</span>
                        <span className="key">7</span>
                        <span className="fn-keys">
                            <span className="fn-key">HOME</span>
                            <span className="fn-key">7</span>
                        </span>
                    </button>

                    <button className="content-between" data-key-name="8">
                        <span className="shift-key asterisk">*</span>
                        <span className="key">8</span>
                        <span className="fn-keys">
                            <span className="fn-key">
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M277.375 427V167.296l119.702 119.702L427 256 256 85 85 256l29.924 29.922 119.701-118.626V427h42.75z">
                                    </path>
                                </svg>
                            </span>
                            <span className="fn-key">8</span>
                        </span>
                    </button>

                    <button className="content-between" data-key-name="9">
                        <span className="shift-key">(</span>
                        <span className="key">9</span>
                        <span className="fn-keys">
                            <span className="fn-key">PGUP</span>
                            <span className="fn-key">9</span>
                        </span>
                    </button>

                    <button className="content-between" data-key-name="0">
                        <span className="shift-key">)</span>
                        <span className="key">0</span>
                        <span className="fn-key align-right">/</span>
                    </button>

                    <button className="no-fn" data-key-name="minus">
                        <span className="shift-key">_</span>
                        <span className="key">-</span>
                    </button>

                    <button className="no-fn" data-key-name="equals">
                        <span className="shift-key">+</span>
                        <span className="key">=</span>
                    </button>

                    <button className="backspace-key" data-key-name="backspace">
                        <span className="key align-left">
                            <span className="text">
                                <span className="align-left">BACK</span>
                                <span className="align-left">SPACE</span>
                            </span>

                            <span>
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M10.78 19.03a.75.75 0 0 1-1.06 0l-6.25-6.25a.75.75 0 0 1 0-1.06l6.25-6.25a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734L5.81 11.5h14.44a.75.75 0 0 1 0 1.5H5.81l4.97 4.97a.75.75 0 0 1 0 1.06Z">
                                    </path>
                                </svg>
                            </span>
                        </span>
                    </button>
                </div>

                <div className="row row-3">
                    <button className="tab-key" data-key-name="tab">
                        <span className="key align-left">
                            <span>
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24"
                                    strokeLinecap="round" strokeLinejoin="round" height="16px" width="16px"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3 19V5"></path>
                                    <path d="m13 6-6 6 6 6"></path>
                                    <path d="M7 12h14"></path>
                                </svg>
                            </span>

                            <span>
                                <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24"
                                    strokeLinecap="round" strokeLinejoin="round" height="16px" width="16px"
                                    xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17 12H3"></path>
                                    <path d="m11 18 6-6-6-6"></path>
                                    <path d="M21 5v14"></path>
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button data-key-name="q">
                        <span className="key">Q</span>
                    </button>

                    <button data-key-name="w">
                        <span className="key">W</span>
                    </button>

                    <button data-key-name="e">
                        <span className="key">E</span>
                    </button>

                    <button data-key-name="r">
                        <span className="key">R</span>
                    </button>

                    <button data-key-name="t">
                        <span className="key">T</span>
                    </button>

                    <button data-key-name="y">
                        <span className="key">Y</span>
                    </button>

                    <button className="no-shift" data-key-name="u">
                        <span className="key">U</span>
                        <span className="fn-keys">
                            <span className="fn-key">
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M427 234.625H167.296l119.702-119.702L256 85 85 256l171 171 29.922-29.924-118.626-119.701H427v-42.75z">
                                    </path>
                                </svg>
                            </span>
                            <span className="fn-key">4</span>
                        </span>
                    </button>

                    <button className="no-shift" data-key-name="i">
                        <span className="key">I</span>
                        <span className="fn-key align-right">5</span>
                    </button>

                    <button className="no-shift" data-key-name="o">
                        <span className="key">O</span>
                        <span className="fn-keys">
                            <span className="fn-key">
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M85 277.375h259.704L225.002 397.077 256 427l171-171L256 85l-29.922 29.924 118.626 119.701H85v42.75z">
                                    </path>
                                </svg>
                            </span>
                            <span className="fn-key">6</span>
                        </span>
                    </button>

                    <button className="no-shift" data-key-name="p">
                        <span className="key">P</span>
                        <span className="fn-key align-right asterisk">*</span>
                    </button>

                    <button className="content-around" data-key-name="bracket-left">
                        <span className="shift-key">{`{`}</span>
                        <span className="key">[</span>
                    </button>

                    <button className="content-around" data-key-name="bracket-right">
                        <span className="shift-key">{`}`}</span>
                        <span className="key">]</span>
                    </button>

                    <button className="content-around" data-key-name="backslash">
                        <span className="shift-key">{`|`}</span>
                        <span className="key">\</span>
                    </button>
                </div>

                <div className="row row-4">
                    <button className="capslock-key" data-key-name="capslock">
                        <span className="key align-left">
                            <span>CAPS</span>
                            <span>LOCK</span>
                        </span>
                    </button>

                    <button data-key-name="a">
                        <span className="key">A</span>
                    </button>

                    <button className="no-shift" data-key-name="s">
                        <span className="key">S</span>
                        <span className="fn-key align-right">
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 32 32"
                                height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M 19 3 C 13.488281 3 9 7.488281 9 13 C 9 15.394531 9.839844 17.589844 11.25 19.3125 L 3.28125 27.28125 L 4.71875 28.71875 L 12.6875 20.75 C 14.410156 22.160156 16.605469 23 19 23 C 24.511719 23 29 18.511719 29 13 C 29 7.488281 24.511719 3 19 3 Z M 19 5 C 23.429688 5 27 8.570313 27 13 C 27 17.429688 23.429688 21 19 21 C 14.570313 21 11 17.429688 11 13 C 11 8.570313 14.570313 5 19 5 Z">
                                </path>
                            </svg>
                        </span>
                    </button>

                    <button data-key-name="d">
                        <span className="key">D</span>
                    </button>

                    <button className="bump" data-key-name="f">
                        <span className="key">F</span>
                    </button>

                    <button data-key-name="g">
                        <span className="key">G</span>
                    </button>

                    <button data-key-name="h">
                        <span className="key">H</span>
                    </button>

                    <button className="bump no-shift" data-key-name="j">
                        <span className="key">J</span>
                        <span className="fn-keys">
                            <span className="fn-key">END</span>
                            <span className="fn-key">1</span>
                        </span>
                    </button>

                    <button className="no-shift" data-key-name="k">
                        <span className="key">K</span>
                        <span className="fn-keys">
                            <span className="fn-key">   
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M277.375 85v259.704l119.702-119.702L427 256 256 427 85 256l29.924-29.922 119.701 118.626V85h42.75z">
                                    </path>
                                </svg>
                            </span>
                            <span className="fn-key">2</span>
                        </span>
                    </button>

                    <button className="no-shift" data-key-name="l">
                        <span className="key">L</span>
                        <span className="fn-keys">
                            <span className="fn-key">PGDN</span>
                            <span className="fn-key">3</span>
                        </span>
                    </button>

                    <button className="content-between" data-key-name="semicolon">
                        <span className="shift-key">:</span>
                        <span className="key">;</span>
                        <span className="fn-key align-right">-</span>
                    </button>

                    <button className="content-between" data-key-name="quote">
                        <span className="shift-key">"</span>
                        <span className="key">'</span>
                    </button>

                    <button className="enter-key" data-key-name="enter">
                        <span className="key align-left">
                            <span>ENTER</span>
                            <span>
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path fill="none" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="32"
                                        d="m112 352-64-64 64-64"></path>
                                    <path fill="none" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="32"
                                        d="M64 288h400V160"></path>
                                </svg>
                            </span>
                        </span>
                    </button>
                </div>

                <div className="row row-5">
                    <button className="shift-left-key" data-key-name="shift-left">
                        <span className="key align-left">
                            <span>SHIFT</span>
                            <span>
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M18.655 10.405a.75.75 0 0 1-1.06 0l-4.97-4.97v14.44a.75.75 0 0 1-1.5 0V5.435l-4.97 4.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l6.25-6.25a.75.75 0 0 1 1.06 0l6.25 6.25a.75.75 0 0 1 0 1.06Z">
                                    </path>
                                </svg>
                            </span>
                        </span>
                    </button>

                    <button className="no-shift" data-key-name="z">
                        <span className="key">Z</span>
                        <span className="fn-key">
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 32 32"
                                height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M 3 7 C 1.90625 7 1 7.90625 1 9 L 1 23 C 1 24.09375 1.90625 25 3 25 L 29 25 C 30.09375 25 31 24.09375 31 23 L 31 9 C 31 7.90625 30.09375 7 29 7 Z M 3 9 L 29 9 L 29 23 L 3 23 Z M 5 11 L 5 13 L 7 13 L 7 11 Z M 9 11 L 9 13 L 11 13 L 11 11 Z M 13 11 L 13 13 L 15 13 L 15 11 Z M 17 11 L 17 13 L 19 13 L 19 11 Z M 21 11 L 21 13 L 23 13 L 23 11 Z M 25 11 L 25 13 L 27 13 L 27 11 Z M 5 15 L 5 17 L 9 17 L 9 15 Z M 11 15 L 11 17 L 13 17 L 13 15 Z M 15 15 L 15 17 L 17 17 L 17 15 Z M 19 15 L 19 17 L 21 17 L 21 15 Z M 23 15 L 23 17 L 27 17 L 27 15 Z M 5 19 L 5 21 L 9 21 L 9 19 Z M 11 19 L 11 21 L 21 21 L 21 19 Z M 23 19 L 23 21 L 27 21 L 27 19 Z">
                                </path>
                            </svg>
                        </span>
                    </button>

                    <button data-key-name="x">
                        <span className="key">X</span>
                    </button>

                    <button data-key-name="c">
                        <span className="key">C</span>
                    </button>

                    <button data-key-name="v">
                        <span className="key">V</span>
                    </button>

                    <button data-key-name="b">
                        <span className="key">B</span>
                    </button>

                    <button data-key-name="n">
                        <span className="key">N</span>
                    </button>

                    <button className="no-shift" data-key-name="m">
                        <span className="key">M</span>
                        <span className="fn-keys">
                            <span className="fn-key">INS</span>
                            <span className="fn-key">0</span>
                        </span>
                    </button>

                    <button className="no-fn" data-key-name="comma">
                        <span className="shift-key">&lt;</span>
                        <span className="key">,</span>
                    </button>

                    <button className="content-between" data-key-name="period">
                        <span className="shift-key">&gt;</span>
                        <span className="key">.</span>
                        <span className="fn-keys">
                            <span className="fn-key">DEL</span>
                            <span className="fn-key">.</span>
                        </span>
                    </button>

                    <button className="content-between" data-key-name="slash">
                        <span className="shift-key">?</span>
                        <span className="key">/</span>
                        <span className="fn-key align-right">+</span>
                    </button>

                    <button className="shift-right-key" data-key-name="shift-right">
                        <span className="key align-left">
                            <span>SHIFT</span>
                            <span>
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 24 24"
                                    height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                    <path
                                        d="M18.655 10.405a.75.75 0 0 1-1.06 0l-4.97-4.97v14.44a.75.75 0 0 1-1.5 0V5.435l-4.97 4.97a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734l6.25-6.25a.75.75 0 0 1 1.06 0l6.25 6.25a.75.75 0 0 1 0 1.06Z">
                                    </path>
                                </svg>
                            </span>
                        </span>
                    </button>

                    <div className="pg-up-dn-keys">
                        <button data-key-name="pgup">
                            <span className="key">PGUP</span>
                        </button>

                        <button data-key-name="pgdn">
                            <span className="key">PGDN</span>
                        </button>
                    </div>
                </div>

                <div className="row row-6">
                    <button className="ctrl-left-key" data-key-name="ctrl-left">
                        <span className="key align-left">CTRL</span>
                    </button>

                    <button data-key-name="fn">
                        <span className="fn-key">FN</span>
                    </button>

                    <button className="window-key" data-key-name="windows">
                        <span className="key">
                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 16 16"
                                height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M6.555 1.375 0 2.237v5.45h6.555zM0 13.795l6.555.933V8.313H0zm7.278-5.4.026 6.378L16 16V8.395zM16 0 7.33 1.244v6.414H16z">
                                </path>
                            </svg>
                        </span>
                    </button>

                    <button className="alt-left-key" data-key-name="alt-left">
                        <span className="key">ALT</span>
                    </button>

                    <button className="space-key" data-key-name="space">
                        <span className="fn-key align-left">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 103.88 79.27" height="16px" width="16px"
                                fill="currentColor" stroke="currentColor" color="currentColor">

                                <path
                                    d="M89.36,76.56l-19.8-23.16c4.42-4.4,7.36-10.33,7.89-17.03,1.17-14.88-9.99-27.94-24.88-29.11-7.21-.56-14.21,1.71-19.71,6.41-5.5,4.7-8.83,11.26-9.4,18.47-1.17,14.88,9.99,27.94,24.88,29.11,6.69.52,13.01-1.46,18.05-5.14l19.8,23.16,3.17-2.71ZM48.67,57.1c-12.59-.99-22.04-12.03-21.05-24.63.48-6.1,3.3-11.65,7.95-15.63,4.65-3.97,10.57-5.9,16.68-5.42,12.59.99,22.04,12.03,21.05,24.63-.99,12.59-12.03,22.04-24.63,21.05ZM52.6,32.24l8.33.23-.12,4.16-8.33-.23-.23,8.33-4.16-.12.23-8.33-8.33-.23.12-4.16,8.33.23.23-8.33,4.16.12-.23,8.33Z" />

                                <path
                                    d="M74.56,68.86H11.47c-5.44,0-9.84-4.44-9.84-9.91V11.54C1.63,6.07,6.04,1.63,11.47,1.63h80.94c5.44,0,9.84,4.44,9.84,9.91v47.41c0,5.47-4.41,9.91-9.84,9.91h-6.63"
                                    fill="none" strokeWidth="3.26" strokeMiterlimit="10" />
                            </svg>
                        </span>
                    </button>

                    <button className="alt-right-key" data-key-name="alt-right">
                        <span className="key">ALT</span>
                    </button>

                    <button className="menu-key" data-key-name="menu">
                        <span className="key">
                            <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24"
                                strokeLinecap="round" strokeLinejoin="round" height="16px" width="16px"
                                xmlns="http://www.w3.org/2000/svg">
                                <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                                <path d="M7 8h10"></path>
                                <path d="M7 12h10"></path>
                                <path d="M7 16h10"></path>
                            </svg>
                        </span>
                    </button>

                    <button className="ctrl-right-key" data-key-name="ctrl-right">
                        <span className="key">CTRL</span>
                    </button>

                    <div className="arrow-keys">
                        <div className="upper">
                            <button data-key-name="arrow-up">
                                <span className="key">
                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512"
                                        height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M277.375 427V167.296l119.702 119.702L427 256 256 85 85 256l29.924 29.922 119.701-118.626V427h42.75z">
                                        </path>
                                    </svg>
                                </span>
                            </button>
                        </div>

                        <div className="lower">
                            <button data-key-name="arrow-left">
                                <span className="key">
                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512"
                                        height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M427 234.625H167.296l119.702-119.702L256 85 85 256l171 171 29.922-29.924-118.626-119.701H427v-42.75z">
                                        </path>
                                    </svg>
                                </span>
                            </button>

                            <button data-key-name="arrow-down">
                                <span className="key">
                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512"
                                        height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M277.375 85v259.704l119.702-119.702L427 256 256 427 85 256l29.924-29.922 119.701 118.626V85h42.75z">
                                        </path>
                                    </svg>
                                </span>
                            </button>

                            <button data-key-name="arrow-right">
                                <span className="key">
                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512"
                                        height="16px" width="16px" xmlns="http://www.w3.org/2000/svg">
                                        <path
                                            d="M85 277.375h259.704L225.002 397.077 256 427l171-171L256 85l-29.922 29.924 118.626 119.701H85v42.75z">
                                        </path>
                                    </svg>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};