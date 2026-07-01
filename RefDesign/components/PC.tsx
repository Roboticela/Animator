import "../styles/PC.css";

export const PC = () => {
    return (
        <div className="PC-colors">
            <div className="keyboard">
                {/* Top row (function key row + lock keys + indicators) */}
                <div className="keyboard-top">
                    {/* Function keys row */}
                    <div className="row function-key-row">
                        <button className="key content-center" data-key-name="esc">
                            <span className="key-primary">Esc</span>
                        </button>

                        <button className="key content-center" data-key-name="f1">
                            <span className="key-primary">F1</span>
                        </button>
                        <button className="key content-center" data-key-name="f2">
                            <span className="key-primary">F2</span>
                        </button>
                        <button className="key content-center" data-key-name="f3">
                            <span className="key-primary">F3</span>
                        </button>
                        <button className="key content-center" data-key-name="f4">
                            <span className="key-primary">F4</span>
                        </button>

                        <button className="key content-center" data-key-name="f5">
                            <span className="key-primary">F5</span>
                        </button>
                        <button className="key content-center" data-key-name="f6">
                            <span className="key-primary">F6</span>
                        </button>
                        <button className="key content-center" data-key-name="f7">
                            <span className="key-primary">F7</span>
                        </button>
                        <button className="key content-center" data-key-name="f8">
                            <span className="key-primary">F8</span>
                        </button>

                        <button className="key content-center" data-key-name="f9">
                            <span className="key-primary">F9</span>
                        </button>
                        <button className="key content-center" data-key-name="f10">
                            <span className="key-primary">F10</span>
                        </button>
                        <button className="key content-center" data-key-name="f11">
                            <span className="key-primary">F11</span>
                        </button>
                        <button className="key content-center" data-key-name="f12">
                            <span className="key-primary">F12</span>
                        </button>
                    </div>

                    {/* Lock keys row */}
                    <div className="row lock-key-row">
                        <button className="key content-center text-small" data-key-name="prtsc">
                            <span className="key-primary multi-line">
                                <span className="line">Print</span>
                                <span className="line">Screen</span>
                                <span className="line">SysRq</span>
                            </span>
                        </button>

                        <button className="key content-center text-small" data-key-name="scroll-lock">
                            <span className="key-primary multi-line">
                                <span className="line">Scroll</span>
                                <span className="line">Lock</span>
                            </span>
                        </button>

                        <button className="key content-center text-small" data-key-name="pause-break">
                            <span className="key-primary multi-line">
                                <span className="line">Pause</span>
                                <span className="line">Break</span>
                            </span>
                        </button>
                    </div>

                    {/* Indicators row */}
                    <div className="row indicators">
                        <span className="indicator">
                            <span className="indicator-light" data-indicator="capslock"></span>
                            <span className="indicator-icon content-center text-small">A</span>
                        </span>

                        <span className="indicator">
                            <span className="indicator-light" data-indicator="numlock"></span>
                            <span className="indicator-icon content-center text-small">1</span>
                        </span>

                        <span className="indicator">
                            <span className="indicator-light" data-indicator="scrolllock"></span>
                            <span className="indicator-icon content-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                                    strokeLinejoin="round">
                                    <path d="M12 17V3" />
                                    <path d="m6 11 6 6 6-6" />
                                    <path d="M19 21H5" />
                                </svg>
                            </span>
                        </span>
                    </div>
                </div>

                {/* Remaining keyboard */}
                <div className="keyboard-bottom">
                    {/* Main key area */}
                    <div className="keyboard-main">
                        {/* Number row */}
                        <div className="row">
                            <button className="key" data-key-name="backtick">
                                <span className="key-secondary">~</span>
                                <span className="key-primary">`</span>
                            </button>
                            <button className="key" data-key-name="1">
                                <span className="key-secondary">!</span>
                                <span className="key-primary">1</span>
                            </button>
                            <button className="key" data-key-name="2">
                                <span className="key-secondary">@</span>
                                <span className="key-primary">2</span>
                            </button>
                            <button className="key" data-key-name="3">
                                <span className="key-secondary">#</span>
                                <span className="key-primary">3</span>
                            </button>
                            <button className="key" data-key-name="4">
                                <span className="key-secondary">$</span>
                                <span className="key-primary">4</span>
                            </button>
                            <button className="key" data-key-name="5">
                                <span className="key-secondary">%</span>
                                <span className="key-primary">5</span>
                            </button>
                            <button className="key" data-key-name="6">
                                <span className="key-secondary">^</span>
                                <span className="key-primary">6</span>
                            </button>
                            <button className="key" data-key-name="7">
                                <span className="key-secondary">&amp;</span>
                                <span className="key-primary">7</span>
                            </button>
                            <button className="key" data-key-name="8">
                                <span className="key-secondary">*</span>
                                <span className="key-primary">8</span>
                            </button>
                            <button className="key" data-key-name="9">
                                <span className="key-secondary">(</span>
                                <span className="key-primary">9</span>
                            </button>
                            <button className="key" data-key-name="0">
                                <span className="key-secondary">)</span>
                                <span className="key-primary">0</span>
                            </button>
                            <button className="key" data-key-name="minus">
                                <span className="key-secondary">—</span>
                                <span className="key-primary">-</span>
                            </button>
                            <button className="key" data-key-name="equals">
                                <span className="key-secondary">+</span>
                                <span className="key-primary">=</span>
                            </button>
                            <button className="key key-backspace content-center text-medium" data-key-name="backspace">
                                <div className="key-icon">
                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                        viewBox="0 0 448 512" height="200px" width="200px"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path>
                                    </svg>
                                </div>
                            </button>
                        </div>

                        {/* QWERTY rows + Enter key group */}
                        <div className="rows-key-group">
                            <div className="rows">
                                {/* QWERTY row */}
                                <div className="row">
                                    <button className="key key-tab content-center text-medium" data-key-name="tab">
                                        <span className="key-primary">Tab</span>
                                        <span className="key-icon">
                                            <svg stroke="currentColor" fill="none" strokeWidth="2"
                                                viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
                                                height="200px" width="200px" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M3 19V5"></path>
                                                <path d="m13 6-6 6 6 6"></path>
                                                <path d="M7 12h14"></path>
                                            </svg>
                                            <svg stroke="currentColor" fill="none" strokeWidth="2"
                                                viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
                                                height="200px" width="200px" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M17 12H3"></path>
                                                <path d="m11 18 6-6-6-6"></path>
                                                <path d="M21 5v14"></path>
                                            </svg>
                                        </span>
                                    </button>

                                    <button className="key" data-key-name="q"><span className="key-primary">Q</span></button>
                                    <button className="key" data-key-name="w"><span className="key-primary">W</span></button>
                                    <button className="key" data-key-name="e"><span className="key-primary">E</span></button>
                                    <button className="key" data-key-name="r"><span className="key-primary">R</span></button>
                                    <button className="key" data-key-name="t"><span className="key-primary">T</span></button>
                                    <button className="key" data-key-name="y"><span className="key-primary">Y</span></button>
                                    <button className="key" data-key-name="u"><span className="key-primary">U</span></button>
                                    <button className="key" data-key-name="i"><span className="key-primary">I</span></button>
                                    <button className="key" data-key-name="o"><span className="key-primary">O</span></button>
                                    <button className="key" data-key-name="p"><span className="key-primary">P</span></button>

                                    <button className="key align-center" data-key-name="bracket-left">
                                        <span className="key-secondary">&#123;</span>
                                        <span className="key-primary">[</span>
                                    </button>
                                    <button className="key align-center" data-key-name="bracket-right">
                                        <span className="key-secondary">&#125;</span>
                                        <span className="key-primary">]</span>
                                    </button>
                                </div>

                                {/* ASDF row */}
                                <div className="row">
                                    <button className="key key-capslock content-center text-medium" data-key-name="capslock">
                                        <span className="key-primary">CapsLock</span>
                                    </button>
                                    <button className="key" data-key-name="a"><span className="key-primary">A</span></button>
                                    <button className="key" data-key-name="s"><span className="key-primary">S</span></button>
                                    <button className="key" data-key-name="d"><span className="key-primary">D</span></button>

                                    <button className="key key-bump" data-key-name="f">
                                        <span className="key-primary">F</span>
                                        <span className="bump self-center"></span>
                                    </button>

                                    <button className="key" data-key-name="g"><span className="key-primary">G</span></button>
                                    <button className="key" data-key-name="h"><span className="key-primary">H</span></button>

                                    <button className="key key-bump" data-key-name="j">
                                        <span className="key-primary">J</span>
                                        <span className="bump self-center"></span>
                                    </button>

                                    <button className="key" data-key-name="k"><span className="key-primary">K</span></button>
                                    <button className="key" data-key-name="l"><span className="key-primary">L</span></button>

                                    <button className="key align-center" data-key-name="semicolon">
                                        <span className="key-secondary">:</span>
                                        <span className="key-primary">;</span>
                                    </button>
                                    <button className="key align-center" data-key-name="quote">
                                        <span className="key-secondary">"</span>
                                        <span className="key-primary">'</span>
                                    </button>
                                    <button className="key align-center" data-key-name="backslash">
                                        <span className="key-secondary">|</span>
                                        <span className="key-primary">\</span>
                                    </button>
                                </div>
                            </div>

                            {/* Enter key — spans two rows via clip-path */}
                            <div className="row-key row-key-enter">
                                <button className="key key-enter align-start justify-start text-medium" data-key-name="enter">
                                    <span className="key-icon">
                                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                            viewBox="0 0 512 512" height="200px" width="200px"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path fill="none" strokeLinecap="round" strokeLinejoin="round"
                                                strokeWidth="32" d="m112 352-64-64 64-64"></path>
                                            <path fill="none" strokeLinecap="round" strokeLinejoin="round"
                                                strokeWidth="32" d="M64 288h294c58.76 0 106-49.33 106-108v-20"></path>
                                        </svg>
                                    </span>
                                    <span className="key-primary">Enter</span>
                                </button>
                            </div>
                        </div>

                        {/* Shift row */}
                        <div className="row">
                            <button className="key key-shift shift-left align-center justify-start text-medium" data-key-name="shift-left">
                                <span className="key-icon">
                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1"
                                        viewBox="0 0 16 16" height="200px" width="200px"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.5 14h-5c-0.276 0-0.5-0.224-0.5-0.5v-5.5h-2c-0.202 0-0.385-0.122-0.462-0.309s-0.035-0.402 0.108-0.545l5-5c0.195-0.195 0.512-0.195 0.707 0l5 5c0.143 0.143 0.186 0.358 0.108 0.545s-0.26 0.309-0.462 0.309h-2v5.5c0 0.276-0.224 0.5-0.5 0.5zM6 13h4v-5.5c0-0.276 0.224-0.5 0.5-0.5h1.293l-3.793-3.793-3.793 3.793h1.293c0.276 0 0.5 0.224 0.5 0.5v5.5z"></path>
                                    </svg>
                                </span>
                                <span className="key-primary">Shift</span>
                            </button>

                            <button className="key" data-key-name="z"><span className="key-primary">Z</span></button>
                            <button className="key" data-key-name="x"><span className="key-primary">X</span></button>
                            <button className="key" data-key-name="c"><span className="key-primary">C</span></button>
                            <button className="key" data-key-name="v"><span className="key-primary">V</span></button>
                            <button className="key" data-key-name="b"><span className="key-primary">B</span></button>
                            <button className="key" data-key-name="n"><span className="key-primary">N</span></button>
                            <button className="key" data-key-name="m"><span className="key-primary">M</span></button>

                            <button className="key" data-key-name="comma">
                                <span className="key-secondary">&lt;</span>
                                <span className="key-primary">,</span>
                            </button>
                            <button className="key" data-key-name="period">
                                <span className="key-secondary">&gt;</span>
                                <span className="key-primary">.</span>
                            </button>
                            <button className="key" data-key-name="slash">
                                <span className="key-secondary">?</span>
                                <span className="key-primary">/</span>
                            </button>

                            <button className="key key-shift shift-right align-center justify-start text-medium" data-key-name="shift-right">
                                <span className="key-icon">
                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0" version="1.1"
                                        viewBox="0 0 16 16" height="200px" width="200px"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10.5 14h-5c-0.276 0-0.5-0.224-0.5-0.5v-5.5h-2c-0.202 0-0.385-0.122-0.462-0.309s-0.035-0.402 0.108-0.545l5-5c0.195-0.195 0.512-0.195 0.707 0l5 5c0.143 0.143 0.186 0.358 0.108 0.545s-0.26 0.309-0.462 0.309h-2v5.5c0 0.276-0.224 0.5-0.5 0.5zM6 13h4v-5.5c0-0.276 0.224-0.5 0.5-0.5h1.293l-3.793-3.793-3.793 3.793h1.293c0.276 0 0.5 0.224 0.5 0.5v5.5z"></path>
                                    </svg>
                                </span>
                                <span className="key-primary">Shift</span>
                            </button>
                        </div>

                        {/* Bottom modifier row */}
                        <div className="row">
                            <button className="key key-ctrl justify-center align-start key-medium text-medium" data-key-name="ctrl-left">
                                <span className="key-primary">Ctrl</span>
                            </button>

                            <button className="key key-windows content-center key-medium" data-key-name="windows-left">
                                <span className="key-icon">
                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                        viewBox="0 0 16 16" height="200px" width="200px"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6.555 1.375 0 2.237v5.45h6.555zM0 13.795l6.555.933V8.313H0zm7.278-5.4.026 6.378L16 16V8.395zM16 0 7.33 1.244v6.414H16z"></path>
                                    </svg>
                                </span>
                            </button>

                            <button className="key key-alt justify-center align-start key-medium text-medium" data-key-name="alt-left">
                                <span className="key-primary">Alt</span>
                            </button>

                            <button className="key key-space" data-key-name="space"></button>

                            <button className="key key-alt justify-center align-start key-medium text-medium" data-key-name="alt-right">
                                <span className="key-primary">Alt</span>
                            </button>

                            <button className="key key-windows content-center key-medium" data-key-name="windows-right">
                                <span className="key-icon">
                                    <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                        viewBox="0 0 16 16" height="200px" width="200px"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6.555 1.375 0 2.237v5.45h6.555zM0 13.795l6.555.933V8.313H0zm7.278-5.4.026 6.378L16 16V8.395zM16 0 7.33 1.244v6.414H16z"></path>
                                    </svg>
                                </span>
                            </button>

                            <button className="key key-menu justify-center align-start key-medium" data-key-name="menu">
                                <span className="key-icon">
                                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24"
                                        strokeLinecap="round" strokeLinejoin="round" height="200px" width="200px"
                                        xmlns="http://www.w3.org/2000/svg">
                                        <rect width="18" height="18" x="3" y="3" rx="2"></rect>
                                        <path d="M7 8h10"></path>
                                        <path d="M7 12h10"></path>
                                        <path d="M7 16h10"></path>
                                    </svg>
                                </span>
                            </button>

                            <button className="key key-ctrl justify-center align-start key-medium text-medium" data-key-name="ctrl-right">
                                <span className="key-primary">Ctrl</span>
                            </button>
                        </div>
                    </div>

                    {/* Navigation cluster */}
                    <div className="keyboard-nav">
                        <div className="rows nav-keys">
                            <div className="row">
                                <button className="key content-center text-small" data-key-name="insert">
                                    <span className="key-primary">Insert</span>
                                </button>
                                <button className="key content-center text-small" data-key-name="home">
                                    <span className="key-primary">Home</span>
                                </button>
                                <button className="key content-center text-small" data-key-name="pgup">
                                    <span className="key-primary multi-line">
                                        <span className="line">Page</span>
                                        <span className="line">Up</span>
                                    </span>
                                </button>
                            </div>
                            <div className="row">
                                <button className="key content-center text-small" data-key-name="delete">
                                    <span className="key-primary">Delete</span>
                                </button>
                                <button className="key content-center text-small" data-key-name="end">
                                    <span className="key-primary">End</span>
                                </button>
                                <button className="key content-center text-small" data-key-name="pgdn">
                                    <span className="key-primary multi-line">
                                        <span className="line">Page</span>
                                        <span className="line">Down</span>
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="rows arrow-keys">
                            <div className="row">
                                <button className="key content-center" data-key-name="arrow-up">
                                    <span className="key-icon arrow-up-icon">
                                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                            viewBox="0 0 448 512" height="200px" width="200px"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path>
                                        </svg>
                                    </span>
                                </button>
                            </div>
                            <div className="row">
                                <button className="key content-center" data-key-name="arrow-left">
                                    <span className="key-icon arrow-left-icon">
                                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                            viewBox="0 0 448 512" height="200px" width="200px"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path>
                                        </svg>
                                    </span>
                                </button>
                                <button className="key content-center" data-key-name="arrow-down">
                                    <span className="key-icon arrow-down-icon">
                                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                            viewBox="0 0 448 512" height="200px" width="200px"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path>
                                        </svg>
                                    </span>
                                </button>
                                <button className="key content-center" data-key-name="arrow-right">
                                    <span className="key-icon arrow-right-icon">
                                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                            viewBox="0 0 448 512" height="200px" width="200px"
                                            xmlns="http://www.w3.org/2000/svg">
                                            <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path>
                                        </svg>
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Numpad */}
                    <div className="keyboard-numpad">
                        <div className="row">
                            <button className="key content-center text-small" data-key-name="numlock">
                                <span className="key-primary multi-line">
                                    <span className="line">Num</span>
                                    <span className="line">Lock</span>
                                </span>
                            </button>
                            <button className="key content-center" data-key-name="num-slash">
                                <span className="key-primary">/</span>
                            </button>
                            <button className="key content-center" data-key-name="num-multiply">
                                <span className="key-primary">*</span>
                            </button>
                            <button className="key content-center" data-key-name="num-minus">
                                <span className="key-primary">-</span>
                            </button>
                        </div>

                        {/* Numpad 7-9 row + plus key */}
                        <div className="rows-key-group">
                            <div className="rows">
                                <div className="row">
                                    <button className="key justify-between align-center" data-key-name="num7">
                                        <span className="key-primary">7</span>
                                        <span className="text-small">Home</span>
                                    </button>
                                    <button className="key justify-between align-center" data-key-name="num8">
                                        <span className="key-primary">8</span>
                                        <span className="key-icon arrow-up-icon">
                                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                                viewBox="0 0 448 512" height="200px" width="200px"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path>
                                            </svg>
                                        </span>
                                    </button>
                                    <button className="key justify-between align-center" data-key-name="num9">
                                        <span className="key-primary">9</span>
                                        <span className="text-small">PgUp</span>
                                    </button>
                                </div>

                                {/* Numpad 4-6 row */}
                                <div className="row">
                                    <button className="key justify-between align-center" data-key-name="num4">
                                        <span className="key-primary">4</span>
                                        <span className="key-icon arrow-left-icon">
                                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                                viewBox="0 0 448 512" height="200px" width="200px"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path>
                                            </svg>
                                        </span>
                                    </button>
                                    <button className="key justify-between align-center key-bump" data-key-name="num5">
                                        <span className="key-primary">5</span>
                                        <span className="bump"></span>
                                    </button>
                                    <button className="key justify-between align-center" data-key-name="num6">
                                        <span className="key-primary">6</span>
                                        <span className="key-icon arrow-right-icon">
                                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                                viewBox="0 0 448 512" height="200px" width="200px"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path>
                                            </svg>
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div className="row-key">
                                <button className="key align-start justify-start space-top" data-key-name="num-plus">
                                    <span className="key-primary">+</span>
                                </button>
                            </div>
                        </div>

                        {/* Numpad 1-3 and 0 rows + Enter key */}
                        <div className="rows-key-group">
                            <div className="rows">
                                <div className="row">
                                    <button className="key justify-between align-center" data-key-name="num1">
                                        <span className="key-primary">1</span>
                                        <span className="text-small">End</span>
                                    </button>
                                    <button className="key justify-between align-center" data-key-name="num2">
                                        <span className="key-primary">2</span>
                                        <span className="key-icon arrow-down-icon">
                                            <svg stroke="currentColor" fill="currentColor" strokeWidth="0"
                                                viewBox="0 0 448 512" height="200px" width="200px"
                                                xmlns="http://www.w3.org/2000/svg">
                                                <path d="M134.059 296H436c6.627 0 12-5.373 12-12v-56c0-6.627-5.373-12-12-12H134.059v-46.059c0-21.382-25.851-32.09-40.971-16.971L7.029 239.029c-9.373 9.373-9.373 24.569 0 33.941l86.059 86.059c15.119 15.119 40.971 4.411 40.971-16.971V296z"></path>
                                            </svg>
                                        </span>
                                    </button>
                                    <button className="key justify-between align-center" data-key-name="num3">
                                        <span className="key-primary">3</span>
                                        <span className="text-small">PgDn</span>
                                    </button>
                                </div>

                                <div className="row">
                                    <button className="key justify-between align-start key-large space-left" data-key-name="num0">
                                        <span className="key-primary">0</span>
                                        <span className="text-small">Ins</span>
                                    </button>
                                    <button className="key justify-between align-center" data-key-name="num-period">
                                        <span className="key-primary">.</span>
                                        <span className="text-small">Del</span>
                                    </button>
                                </div>
                            </div>

                            <div className="row-key">
                                <button className="key align-start justify-start space-top" data-key-name="num-enter">
                                    <span className="key-primary text-small">Enter</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
