import "./globals.css";

export const metadata = {
  title: "MedAI — COVID-19 Classifier",
  description:
    "Production-ready COVID-19 / Pneumonia classification with Explainable AI (Grad-CAM)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
