"use client";

import React, {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";

import "./GradualBlur.css";

type BlurPosition = "top" | "bottom" | "left" | "right";
type BlurCurve = "linear" | "bezier" | "ease-in" | "ease-out" | "ease-in-out";
type BlurTarget = "parent" | "page";
type BlurAnimation = boolean | "scroll";
type Dimension = string | number;
type ResponsiveDimension = "height" | "width";

export interface GradualBlurProps {
  position?: BlurPosition;
  strength?: number;
  height?: Dimension;
  width?: Dimension;
  divCount?: number;
  exponential?: boolean;
  zIndex?: number;
  animated?: BlurAnimation;
  duration?: string;
  easing?: string;
  opacity?: number;
  curve?: BlurCurve;
  responsive?: boolean;
  target?: BlurTarget;
  preset?: keyof typeof PRESETS;
  className?: string;
  style?: CSSProperties;
  hoverIntensity?: number;
  mobileHeight?: Dimension;
  tabletHeight?: Dimension;
  desktopHeight?: Dimension;
  mobileWidth?: Dimension;
  tabletWidth?: Dimension;
  desktopWidth?: Dimension;
  onAnimationComplete?: () => void;
}

type ResolvedConfig = GradualBlurProps & {
  position: BlurPosition;
  strength: number;
  height: Dimension;
  divCount: number;
  exponential: boolean;
  zIndex: number;
  animated: BlurAnimation;
  duration: string;
  easing: string;
  opacity: number;
  curve: BlurCurve;
  responsive: boolean;
  target: BlurTarget;
  className: string;
  style: CSSProperties;
};

const DEFAULT_CONFIG: ResolvedConfig = {
  position: "bottom",
  strength: 2,
  height: "6rem",
  divCount: 5,
  exponential: false,
  zIndex: 1000,
  animated: false,
  duration: "0.3s",
  easing: "ease-out",
  opacity: 1,
  curve: "linear",
  responsive: false,
  target: "parent",
  className: "",
  style: {},
};

export const PRESETS = {
  top: { position: "top", height: "6rem" },
  bottom: { position: "bottom", height: "6rem" },
  left: { position: "left", height: "6rem" },
  right: { position: "right", height: "6rem" },
  subtle: { height: "4rem", strength: 1, opacity: 0.8, divCount: 3 },
  intense: { height: "10rem", strength: 4, divCount: 8, exponential: true },
  smooth: { height: "8rem", curve: "bezier", divCount: 10 },
  sharp: { height: "5rem", curve: "linear", divCount: 4 },
  header: { position: "top", height: "8rem", curve: "ease-out" },
  footer: { position: "bottom", height: "8rem", curve: "ease-out" },
  sidebar: { position: "left", height: "6rem", strength: 2.5 },
  "page-header": { position: "top", height: "10rem", target: "page", strength: 3 },
  "page-footer": { position: "bottom", height: "10rem", target: "page", strength: 3 },
} satisfies Record<string, Partial<GradualBlurProps>>;

export const CURVE_FUNCTIONS: Record<BlurCurve, (progress: number) => number> = {
  linear: (progress) => progress,
  bezier: (progress) => progress * progress * (3 - 2 * progress),
  "ease-in": (progress) => progress * progress,
  "ease-out": (progress) => 1 - Math.pow(1 - progress, 2),
  "ease-in-out": (progress) =>
    progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2,
};

const GRADIENT_DIRECTIONS: Record<BlurPosition, string> = {
  top: "to top",
  bottom: "to bottom",
  left: "to left",
  right: "to right",
};

function debounce<TArgs extends unknown[]>(
  callback: (...args: TArgs) => void,
  wait: number,
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  return (...args: TArgs) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => callback(...args), wait);
  };
}

function getResponsiveValue(
  config: ResolvedConfig,
  key: ResponsiveDimension,
): Dimension | undefined {
  const width = window.innerWidth;
  const suffix = key === "height" ? "Height" : "Width";
  const mobile = config[`mobile${suffix}` as "mobileHeight" | "mobileWidth"];
  const tablet = config[`tablet${suffix}` as "tabletHeight" | "tabletWidth"];
  const desktop = config[`desktop${suffix}` as "desktopHeight" | "desktopWidth"];

  if (width <= 480 && mobile !== undefined) return mobile;
  if (width <= 768 && tablet !== undefined) return tablet;
  if (width <= 1024 && desktop !== undefined) return desktop;
  return config[key];
}

function useResponsiveDimension(
  config: ResolvedConfig,
  key: ResponsiveDimension,
) {
  const [value, setValue] = useState<Dimension | undefined>(config[key]);

  useEffect(() => {
    if (!config.responsive) {
      setValue(config[key]);
      return;
    }

    const calculate = () => setValue(getResponsiveValue(config, key));
    const debouncedCalculate = debounce(calculate, 100);

    calculate();
    window.addEventListener("resize", debouncedCalculate);
    return () => window.removeEventListener("resize", debouncedCalculate);
  }, [config, key]);

  return config.responsive ? value : config[key];
}

function useIntersectionObserver(
  ref: RefObject<Element | null>,
  shouldObserve: boolean,
) {
  const [isVisible, setIsVisible] = useState(!shouldObserve);

  useEffect(() => {
    const element = ref.current;
    if (!shouldObserve || !element) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, shouldObserve]);

  return isVisible;
}

function durationToMilliseconds(duration: string) {
  const parsed = Number.parseFloat(duration);
  if (!Number.isFinite(parsed)) return 0;
  return duration.trim().endsWith("ms") ? parsed : parsed * 1000;
}

function GradualBlur(props: GradualBlurProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const config = useMemo<ResolvedConfig>(() => {
    const presetConfig = props.preset ? PRESETS[props.preset] : undefined;
    return { ...DEFAULT_CONFIG, ...presetConfig, ...props };
  }, [props]);

  const responsiveHeight = useResponsiveDimension(config, "height");
  const responsiveWidth = useResponsiveDimension(config, "width");
  const isVisible = useIntersectionObserver(
    containerRef,
    config.animated === "scroll",
  );

  const blurDivs = useMemo(() => {
    const divCount = Math.max(1, Math.floor(config.divCount));
    const increment = 100 / divCount;
    const currentStrength =
      isHovered && config.hoverIntensity
        ? config.strength * config.hoverIntensity
        : config.strength;
    const curve = CURVE_FUNCTIONS[config.curve];

    return Array.from({ length: divCount }, (_, index) => {
      const step = index + 1;
      const progress = curve(step / divCount);
      const blurValue = config.exponential
        ? Math.pow(2, progress * 4) * 0.0625 * currentStrength
        : 0.0625 * (progress * divCount + 1) * currentStrength;
      const p1 = Math.round((increment * step - increment) * 10) / 10;
      const p2 = Math.round(increment * step * 10) / 10;
      const p3 = Math.round((increment * step + increment) * 10) / 10;
      const p4 = Math.round((increment * step + increment * 2) * 10) / 10;

      let gradient = `transparent ${p1}%, black ${p2}%`;
      if (p3 <= 100) gradient += `, black ${p3}%`;
      if (p4 <= 100) gradient += `, transparent ${p4}%`;

      const mask = `linear-gradient(${GRADIENT_DIRECTIONS[config.position]}, ${gradient})`;
      const style: CSSProperties = {
        position: "absolute",
        inset: 0,
        maskImage: mask,
        WebkitMaskImage: mask,
        backdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        WebkitBackdropFilter: `blur(${blurValue.toFixed(3)}rem)`,
        opacity: config.opacity,
        transition:
          config.animated && config.animated !== "scroll"
            ? `backdrop-filter ${config.duration} ${config.easing}`
            : undefined,
      };

      return <div key={step} style={style} />;
    });
  }, [config, isHovered]);

  const containerStyle = useMemo<CSSProperties>(() => {
    const isVertical = config.position === "top" || config.position === "bottom";
    const isPageTarget = config.target === "page";
    const style: CSSProperties = {
      position: isPageTarget ? "fixed" : "absolute",
      pointerEvents: config.hoverIntensity ? "auto" : "none",
      opacity: isVisible ? 1 : 0,
      transition: config.animated
        ? `opacity ${config.duration} ${config.easing}`
        : undefined,
      zIndex: isPageTarget ? config.zIndex + 100 : config.zIndex,
      ...config.style,
    };

    if (isVertical) {
      style.height = responsiveHeight;
      style.width = responsiveWidth ?? "100%";
      style.left = 0;
      style.right = 0;
    } else {
      style.width = responsiveWidth ?? responsiveHeight;
      style.height = "100%";
      style.top = 0;
      style.bottom = 0;
    }

    style[config.position] = 0;
    return style;
  }, [config, responsiveHeight, responsiveWidth, isVisible]);

  useEffect(() => {
    if (
      !isVisible ||
      config.animated !== "scroll" ||
      !config.onAnimationComplete
    ) {
      return;
    }

    const timeout = setTimeout(
      config.onAnimationComplete,
      durationToMilliseconds(config.duration),
    );
    return () => clearTimeout(timeout);
  }, [config, isVisible]);

  return (
    <div
      ref={containerRef}
      className={`gradual-blur ${config.target === "page" ? "gradual-blur-page" : "gradual-blur-parent"} ${config.className}`}
      style={containerStyle}
      onMouseEnter={
        config.hoverIntensity ? () => setIsHovered(true) : undefined
      }
      onMouseLeave={
        config.hoverIntensity ? () => setIsHovered(false) : undefined
      }
      aria-hidden="true"
    >
      <div className="gradual-blur-inner">{blurDivs}</div>
    </div>
  );
}

const GradualBlurMemo = memo(GradualBlur);
GradualBlurMemo.displayName = "GradualBlur";

export default GradualBlurMemo;
