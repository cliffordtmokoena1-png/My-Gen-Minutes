import React from "react";

interface GradientBackgroundProps {
  className?: string;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({ className }) => {
  const baseClasses = "fixed inset-0 w-full h-full overflow-hidden";
  const combinedClasses = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <div className={combinedClasses}>
      {/* Main gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-purple-50/30 to-blue-50/30" />

      {/* Animated blobs */}
      <div className="absolute -left-1/3 -top-1/3 w-2/3 h-2/3 bg-purple-200/30 rounded-full blur-3xl animate-blob" />
      <div className="absolute -right-1/3 -bottom-1/3 w-2/3 h-2/3 bg-blue-200/30 rounded-full blur-3xl animate-blob animation-delay-2000" />
      <div className="absolute left-1/3 bottom-1/3 w-2/3 h-2/3 bg-emerald-200/30 rounded-full blur-3xl animate-blob animation-delay-4000" />

      {/* Subtle overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-transparent to-white/80" />
    </div>
  );
};

export default GradientBackground;
