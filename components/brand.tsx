import Image from "next/image";

export function MagnetIcon({ className = "h-7 w-auto" }: { className?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center">
      {/* Light mode magnet icon */}
      <Image
        alt="LeadMagnets"
        src="/brand/gemini-logo.png"
        width={160}
        height={160}
        loading="lazy"
        className={`${className} object-contain dark:hidden`}
      />
      {/* Dark mode magnet icon */}
      <Image
        alt="LeadMagnets"
        src="/brand/gemini-logo-dark.png"
        width={160}
        height={160}
        loading="lazy"
        className={`${className} object-contain hidden dark:block`}
      />
    </span>
  );
}

export default function BrandLogo({
  height = "h-11 sm:h-12 lg:h-13",
  className = "",
  collapsed = false,
}: {
  height?: string;
  width?: string;
  className?: string;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <span className={`inline-flex shrink-0 items-center ${className}`}>
        {/* Light mode mark */}
        <Image
          alt="LeadMagnets"
          src="/brand/gemini-logo.png"
          width={160}
          height={160}
          priority
          className={`${height} w-auto object-contain dark:hidden`}
        />
        {/* Dark mode mark */}
        <Image
          alt="LeadMagnets"
          src="/brand/gemini-logo-dark.png"
          width={160}
          height={160}
          priority
          className={`${height} w-auto object-contain hidden dark:block`}
        />
      </span>
    );
  }

  return (
    <span className={`inline-flex shrink-0 items-center ${className}`}>
      {/* Light mode logo — intrinsic 512×160 (3.2:1 ratio) */}
      <Image
        alt="LeadMagnets"
        src="/brand/custom-logo-light.webp"
        width={512}
        height={160}
        priority
        className={`${height} w-auto object-contain dark:hidden`}
      />

      {/* Dark mode logo — transparent background full logo */}
      <Image
        alt="LeadMagnets"
        src="/brand/custom-logo.webp"
        width={512}
        height={160}
        priority
        className={`${height} w-auto object-contain hidden dark:block`}
      />
    </span>
  );
}

export function MagnetsMark({ size = "h-14 w-14", src = "/brand/custom-mark.png" }: { size?: string; src?: string }) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center">
      <Image
        alt="LeadMagnets"
        src={src}
        width={160}
        height={160}
        loading="lazy"
        className={`${size} object-contain`}
      />
    </span>
  );
}

export function GeminiLogo({
  className = "h-10 w-auto",
  size,
  src = "/brand/custom-logo-light.webp",
  darkSrc = "/brand/custom-logo.webp",
}: {
  className?: string;
  size?: string;
  src?: string;
  darkSrc?: string;
}) {
  return (
    <span aria-hidden="true" className="inline-flex shrink-0 items-center justify-center">
      {/* Light mode logo */}
      <Image
        alt="LeadMagnets Logo"
        src={src}
        width={240}
        height={60}
        priority
        className={`${className} object-contain dark:hidden`}
      />
      {/* Dark mode logo */}
      <Image
        alt="LeadMagnets Logo"
        src={darkSrc}
        width={240}
        height={60}
        priority
        className={`${className} object-contain hidden dark:block`}
      />
    </span>
  );
}