import html2canvas from "html2canvas";

export async function captureChartAsImage(
  element: HTMLElement | null
): Promise<string | null> {
  if (!element) return null;
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: "#ffffff",
      scale: 2,
      logging: false,
      useCORS: true,
    });
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Failed to capture chart:", error);
    return null;
  }
}