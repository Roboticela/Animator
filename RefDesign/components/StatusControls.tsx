"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useFnShortcut } from "@/contexts/FnShortcutContext";
import { useKeyboardLock } from "@/contexts/KeyboardLockContext";
import { useFnFunction } from "@/contexts/FnFunctionContext";
import { useSystemState } from "@/contexts/SystemStateContext";
import { useStatusControls } from "@/contexts/StatusControlsContext";
import {
  Keyboard,
  Lock,
  Moon,
  Monitor,
  MonitorOff,
  Battery,
  Touchpad,
  Layout,
  Volume2,
  Sun,
  Lightbulb,
  Wifi,
  Bluetooth,
  Plane,
  Mic,
  MicOff,
  Info,
} from "lucide-react";

interface LEDIndicatorProps {
  isActive: boolean;
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  compact?: boolean;
}

const LEDIndicator = ({ isActive, label, icon, onClick, compact = false }: LEDIndicatorProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`flex items-center gap-1 sm:gap-1.5 ${compact ? "p-0.5 sm:p-1" : "p-1 sm:p-1.5"} rounded-md hover:bg-accent/50 transition-colors ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
      style={{ transformOrigin: "center" }}
    >
      <div className="relative flex items-center justify-center flex-shrink-0">
        <motion.div
          className={`w-2.5 h-2.5 rounded-full border transition-all duration-300 ${
            isActive
              ? "bg-primary border-primary"
              : "bg-background border-border/40"
          }`}
          style={
            isActive
              ? {
                  boxShadow: "0 0 4px currentColor, 0 0 6px currentColor",
                  color: "var(--primary)",
                }
              : {}
          }
          animate={isActive ? { scale: [1, 1.1, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, repeat: isActive ? Infinity : 0, repeatDelay: 1 }}
        />
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.5, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 w-2.5 h-2.5 rounded-full animate-pulse"
              style={{
                background: "var(--primary)",
              }}
            />
          )}
        </AnimatePresence>
      </div>
      {icon && <div className="text-foreground flex-shrink-0">{icon}</div>}
      <span className={`${compact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"} text-foreground font-medium truncate`}>{label}</span>
    </motion.div>
  );
};


interface ControlBarProps {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (value: number) => void;
}

interface ToggleButtonProps {
  isActive: boolean;
  onClick: () => void;
  activeIcon: React.ReactNode;
  inactiveIcon: React.ReactNode;
  label: string;
}

const ToggleButton = ({ isActive, onClick, activeIcon, inactiveIcon, label }: ToggleButtonProps) => (
  <motion.button
    onClick={onClick}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
      className={`w-full p-1.5 sm:p-2 md:p-2.5 rounded-xl border transition-all duration-200 flex flex-col items-center gap-1 sm:gap-1.5 ${
      isActive 
        ? "border-primary bg-primary text-background font-semibold hover:bg-primary/90" 
        : "border-border bg-accent/30 text-foreground hover:border-border hover:bg-accent/50"
    }`}
    style={{ transformOrigin: "center" }}
  >
    <motion.div
      key={isActive ? "active" : "inactive"}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {isActive ? activeIcon : inactiveIcon}
    </motion.div>
    <span className="text-[8px] sm:text-[9px] font-medium">{label}</span>
  </motion.button>
);

const ControlBar = ({ label, icon, value, onChange }: ControlBarProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5"
    >
      <motion.div
        className="text-foreground flex-shrink-0"
        whileHover={{ scale: 1.05, rotate: 3 }}
        transition={{ duration: 0.2 }}
        style={{ transformOrigin: "center" }}
      >
        {icon}
      </motion.div>
      <div className="flex-1 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] sm:text-[10px] text-foreground font-medium">{label}</span>
          <motion.span
            key={value}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-[9px] sm:text-[10px] text-foreground"
          >
            {value}%
          </motion.span>
        </div>
        <div className="relative h-2 bg-background border border-border/40 rounded-full overflow-visible">
          <motion.div
            className="absolute left-0 top-0 h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary border-2 border-background pointer-events-none"
            style={{
              boxShadow: "0 0 6px currentColor, 0 2px 4px rgba(0,0,0,0.3)",
              color: "var(--primary)",
              transformOrigin: "center",
            }}
            animate={{
              left: `calc(${value}% - 6px)`,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            whileHover={{ scale: 1.1 }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            style={{
              background: "transparent",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default function StatusControls() {
  const { fnShortcutEnabled } = useFnShortcut();
  const {
    capsLock,
    numLock,
    scrollLock,
    fnLock,
    fnHold,
    winLock,
    insert,
    toggleCapsLock,
    toggleNumLock,
    toggleScrollLock,
    toggleFnLock,
    toggleFnHold,
    toggleWinLock,
    toggleInsert,
  } = useKeyboardLock();
  const { subscribe } = useFnFunction();
  const { flightMode, toggleFlightMode } = useSystemState();
  const {
    touchpad,
    setTouchpad,
    sleep,
    setSleep,
    lock,
    setLock,
    displayMode,
    setDisplayMode,
    powerSaving,
    setPowerSaving,
    volume,
    setVolume,
    brightness,
    setBrightness,
    keyboardLight,
    setKeyboardLight,
    wifi,
    setWifi,
    bluetooth,
    setBluetooth,
    screenOn,
    setScreenOn,
    mic,
    setMic,
  } = useStatusControls();
  const [, setScreenOff] = useState(false);

  // Subscribe to Fn function calls from keyboard
  useEffect(() => {
    const unsubscribe = subscribe((fnFunction: string) => {
      // Handle Fn function calls based on the function name
      switch (fnFunction) {
        case 'SleepMode':
          setSleep(prev => !prev);
          break;
        case 'AirplaneMode':
          toggleFlightMode();
          break;
        case 'KeyboardBacklight+':
          setKeyboardLight(prev => Math.min(100, prev + 10));
          break;
        case 'KeyboardBacklight-':
          setKeyboardLight(prev => Math.max(0, prev - 10));
          break;
        case 'Brightness-':
          setBrightness(prev => Math.max(0, prev - 10));
          break;
        case 'Brightness+':
          setBrightness(prev => Math.min(100, prev + 10));
          break;
        case 'TurnOffScreen':
          setScreenOn(prev => {
            const newState = !prev;
            setScreenOff(!newState);
            return newState;
          });
          break;
        case 'DisplayModeSwitch':
          // Cycle through display modes
          setDisplayMode(prev => {
            if (prev === 'pc-only') return 'duplicate';
            if (prev === 'duplicate') return 'extend';
            return 'pc-only';
          });
          break;
        case 'TouchpadToggle':
          setTouchpad(prev => !prev);
          break;
        case 'VolumeMute':
          // Toggle mute (set to 0 if not muted, restore previous if muted)
          setVolume(prev => prev > 0 ? 0 : 75);
          break;
        case 'Volume-':
          setVolume(prev => Math.max(0, prev - 10));
          break;
        case 'Volume+':
          setVolume(prev => Math.min(100, prev + 10));
          break;
        default:
          // Unknown Fn function, do nothing
          break;
      }
    });

    return unsubscribe;
  }, [subscribe]);

  const keyboardLocks = [
    { isActive: capsLock, label: "Caps Lock", icon: <Keyboard className="w-4 h-4" />, onClick: toggleCapsLock },
    { isActive: numLock, label: "Num Lock", icon: <Keyboard className="w-4 h-4" />, onClick: toggleNumLock },
    { isActive: scrollLock, label: "Scroll Lock", icon: <Keyboard className="w-4 h-4" />, onClick: toggleScrollLock },
    { isActive: fnLock, label: "Fn Lock", icon: <Keyboard className="w-4 h-4" />, onClick: toggleFnLock },
    { isActive: fnHold, label: "Fn Hold", icon: <Keyboard className="w-4 h-4" />, onClick: toggleFnHold },
    { isActive: winLock, label: "Win Lock", icon: <Keyboard className="w-4 h-4" />, onClick: toggleWinLock },
    { isActive: insert, label: "Overwrite", icon: <Keyboard className="w-4 h-4" />, onClick: toggleInsert },
  ];

  const systemStatus = [
    { isActive: sleep, label: "Sleep", icon: <Moon className="w-4 h-4" />, onClick: () => setSleep(!sleep) },
    { isActive: lock, label: "Lock", icon: <Lock className="w-4 h-4" />, onClick: () => setLock(!lock) },
  ];

  const displayModes = [
    { isActive: displayMode === "pc-only", label: "PC Screen Only", icon: <Monitor className="w-4 h-4" />, onClick: () => setDisplayMode("pc-only") },
    { isActive: displayMode === "duplicate", label: "Duplicate Screen", icon: <Layout className="w-4 h-4" />, onClick: () => setDisplayMode("duplicate") },
    { isActive: displayMode === "extend", label: "Extend Screen", icon: <Monitor className="w-4 h-4" />, onClick: () => setDisplayMode("extend") },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full h-full bg-card/40 backdrop-blur-md rounded-xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col p-1.5 sm:p-2 gap-1.5 sm:gap-2"
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden overflow-y-hidden custom-scrollbar space-y-2 sm:space-y-3">
        {/* Keyboard Locks */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h4 className="text-[9px] sm:text-[10px] font-semibold text-foreground mb-1.5 sm:mb-2 uppercase tracking-wide">Keyboard Locks</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
            {keyboardLocks.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.15 + index * 0.05 }}
              >
                <LEDIndicator
                  isActive={item.isActive}
                  label={item.label}
                  icon={item.icon}
                  onClick={item.onClick}
                />
              </motion.div>
            ))}
          </div>
          {/* FN Key Note */}
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className="mt-2 p-1.5 sm:p-2 rounded-md bg-accent/30 border border-border/40 flex items-center gap-1.5 sm:gap-2"
          >
            <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-foreground/70 flex-shrink-0 mt-0.5" />
            <span className="text-[8px] sm:text-[9px] text-foreground/80 leading-tight">
              {fnShortcutEnabled ? (
                <>To press FN using real keyboard, use <span className="font-semibold text-foreground">Ctrl+Shift+Alt</span></>
              ) : (
                <>Enable Fn Shortcut to use Fn key using shortcut</>
              )}
            </span>
          </motion.div>
        </motion.div>

        {/* System Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <h4 className="text-[9px] sm:text-[10px] font-semibold text-foreground mb-1.5 sm:mb-2 uppercase tracking-wide">System Status</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
            {systemStatus.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.25 + index * 0.05 }}
              >
                <LEDIndicator
                  isActive={item.isActive}
                  label={item.label}
                  icon={item.icon}
                  onClick={item.onClick}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Display Mode */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <h4 className="text-[9px] sm:text-[10px] font-semibold text-foreground mb-1.5 sm:mb-2 uppercase tracking-wide">Display Mode</h4>
          <div className="space-y-1.5 sm:space-y-2">
            {displayModes.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.35 + index * 0.05 }}
              >
                <LEDIndicator
                  isActive={item.isActive}
                  label={item.label}
                  icon={item.icon}
                  onClick={item.onClick}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Power */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <h4 className="text-[9px] sm:text-[10px] font-semibold text-foreground mb-1.5 sm:mb-2 uppercase tracking-wide">Power</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.45 }}
            >
              <LEDIndicator
                isActive={powerSaving}
                label="Power Saving"
                icon={<Battery className="w-4 h-4" />}
                onClick={() => setPowerSaving(!powerSaving)}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Separator */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="border-t border-border/60 my-2"
        />

        {/* Control Bars */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="space-y-1 sm:space-y-1.5"
        >
          <ControlBar
            label="Volume"
            icon={<Volume2 className="w-3 h-3" />}
            value={volume}
            onChange={setVolume}
          />
          <ControlBar
            label="Brightness"
            icon={<Sun className="w-3 h-3" />}
            value={brightness}
            onChange={setBrightness}
          />
          <ControlBar
            label="Keyboard Light"
            icon={<Lightbulb className="w-3 h-3" />}
            value={keyboardLight}
            onChange={setKeyboardLight}
          />
        </motion.div>

        {/* Separator */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="border-t border-border/60 my-2"
        />

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.6 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-1 sm:gap-1.5"
        >
          {[
            { isActive: wifi, onClick: () => setWifi(!wifi), activeIcon: <Wifi className="w-4 h-4" />, inactiveIcon: <Wifi className="w-4 h-4" />, label: "Wifi" },
            { isActive: bluetooth, onClick: () => setBluetooth(!bluetooth), activeIcon: <Bluetooth className="w-4 h-4" />, inactiveIcon: <Bluetooth className="w-4 h-4" />, label: "Bluetooth" },
            { isActive: flightMode, onClick: toggleFlightMode, activeIcon: <Plane className="w-4 h-4" />, inactiveIcon: <Plane className="w-4 h-4" />, label: "Flight" },
            { isActive: screenOn, onClick: () => { setScreenOn(prev => { setScreenOff(!prev); return !prev; }); }, activeIcon: <Monitor className="w-4 h-4" />, inactiveIcon: <MonitorOff className="w-4 h-4" />, label: "Screen" },
            { isActive: touchpad, onClick: () => setTouchpad(!touchpad), activeIcon: <Touchpad className="w-4 h-4" />, inactiveIcon: <Touchpad className="w-4 h-4" />, label: "Touchpad" },
            { isActive: mic, onClick: () => setMic(!mic), activeIcon: <Mic className="w-4 h-4" />, inactiveIcon: <MicOff className="w-4 h-4" />, label: "Mic" },
          ].map((button, index) => (
            <motion.div
              key={button.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, delay: 0.65 + index * 0.05 }}
              className="w-full"
            >
              <ToggleButton
                isActive={button.isActive}
                onClick={button.onClick}
                activeIcon={button.activeIcon}
                inactiveIcon={button.inactiveIcon}
                label={button.label}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}
