export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://www.shahzaibelectronics.pk";
  const normalizedBaseUrl = appUrl.replace(/\/$/, "");

  const body = `# Shahzaib Electronics

> Direct importer and wholesale distributor of car audio, Android multimedia panels, amplifiers, subwoofers, speakers, dash cameras, and steering wheel control accessories in Lahore, Pakistan.

## Key pages
- Homepage: ${normalizedBaseUrl}/
- All products: ${normalizedBaseUrl}/products
- FAQs: ${normalizedBaseUrl}/faqs
- About: ${normalizedBaseUrl}/about
- Services: ${normalizedBaseUrl}/services
- Contact: ${normalizedBaseUrl}/contact
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
