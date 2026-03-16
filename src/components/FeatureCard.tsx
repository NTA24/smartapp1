import React from "react";
import { Link } from "react-router-dom";

const colorClasses: Record<string, { bg: string; text: string; btn: string }> = {
  violet: { bg: "bg-violet-100", text: "text-violet-600", btn: "bg-violet-600" },
  red: { bg: "bg-red-100", text: "text-red-600", btn: "bg-red-600" },
  blue: { bg: "bg-blue-100", text: "text-blue-600", btn: "bg-blue-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600", btn: "bg-purple-600" },
  green: { bg: "bg-green-100", text: "text-green-600", btn: "bg-green-600" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-600", btn: "bg-indigo-600" },
  pink: { bg: "bg-pink-100", text: "text-pink-600", btn: "bg-pink-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600", btn: "bg-orange-600" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600", btn: "bg-yellow-600" },
  teal: { bg: "bg-teal-100", text: "text-teal-600", btn: "bg-teal-600" },
  cyan: { bg: "bg-cyan-100", text: "text-cyan-600", btn: "bg-cyan-600" },
};

export interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  features: string[];
  demoPath: string;
  color: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  features,
  demoPath,
  color,
}) => {
  const c = colorClasses[color] ?? colorClasses.blue;
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className={`inline-flex p-3 rounded-lg mb-4 ${c.bg} ${c.text}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <ul className="space-y-1 text-sm text-gray-700 mb-4">
        {features.slice(0, 4).map((f, i) => (
          <li key={i}>• {f}</li>
        ))}
      </ul>
      <Link
        to={demoPath}
        className={`inline-block px-4 py-2 rounded-lg font-medium ${c.btn} text-white hover:opacity-90`}
      >
        Try demo
      </Link>
    </div>
  );
};
