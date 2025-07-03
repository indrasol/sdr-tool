// -----------------------------------------------------------------------------
// PDF generation utilities – migrated from jsPDF to pdfmake
// -----------------------------------------------------------------------------
// We intentionally keep the same `generatePDF()` public signature so the call
// site (`GenerateReport.tsx`) does not need to change. Internally we now build
// a pdfmake docDefinition and expose a thin wrapper that provides `.save()` to
// maintain backward-compatibility with the old jsPDF API.

// NOTE: pdfmake & markdown-to-pdfmake ship as CommonJS bundles, so we have to
// use `require` / `import` with @ts-ignore to satisfy the TypeScript compiler.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – no ESM types available
import pdfMake from 'pdfmake/build/pdfmake';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – virtual file-system fonts bundle
import pdfFonts from 'pdfmake/build/vfs_fonts';
import MarkdownIt from 'markdown-it';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – html-to-pdfmake has no types in our project
import htmlToPdfmake from 'html-to-pdfmake';

// Register default fonts (Roboto) so pdfmake can embed them. Depending on the
// pdfmake build, `vfs_fonts` may export either `{ pdfMake: { vfs } }` or
// simply `{ vfs }`. Handle both forms safely.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – runtime inspection
const _vfs = (pdfFonts as any)?.pdfMake?.vfs || (pdfFonts as any)?.vfs;
if (_vfs) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  pdfMake.vfs = _vfs;
}

interface ReportPage {
  title: string;
  content: string;
}

// ------------------------------------------------------------
// Helper – convert one section to pdfmake blocks with markdown
// ------------------------------------------------------------
const mdParser = new MarkdownIt({ html: true, linkify: true, breaks: true });

// Banner color helper -------------------------------------------------
type BannerSpec = { bg: string; text: string; icon: string };

const bannerFor = (title: string): BannerSpec => {
  if (title === 'High Risks')   return { bg: '#FEE2E2', text: '#B91C1C', icon: '' };
  if (title === 'Medium Risks') return { bg: '#FEF3C7', text: '#92400E', icon: '' };
  if (title === 'Low Risks')    return { bg: '#DBEAFE', text: '#1E3A8A', icon: '' };
  if (title === 'Model Attack Possibilities') return { bg: '#ECFDF5', text: '#065F46', icon: '' };
  if (title === 'System Design Architecture') return { bg: '#E0F2FE', text: '#0369A1', icon: '' };
  if (title === 'Project Description') return { bg: '#EEF2FF', text: '#4338CA', icon: '' };
  return { bg: '#EAF4FD', text: '#2563eb', icon: '' };
};

// Helper for date
const formatDate = (d: Date) => {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const day = d.getDate();
  const suffix = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${months[d.getMonth()]} ${day}${suffix} ${d.getFullYear()}`;
};

const sectionToBlocks = (title: string, md: string): any[] => {
  const { bg, text, icon } = bannerFor(title);

  const html = mdParser.render(md || '');
  const mdNodes = htmlToPdfmake(html, { window });

  const banner: any = {
    table: {
      widths: ['*'],
      body: [
        [
          { text: title.toUpperCase(), style: 'bannerTitle', alignment: 'center', color: text, tocItem: true }
        ]
      ]
    },
    layout: 'noBorders',
    fillColor: bg,
    margin: [-40, -0, -40, 10],
    pageBreak: 'before'
  };

  return [
    banner,
    ...mdNodes
  ];
};

// ------------------------------------------------------------
// Build the pdfmake document definition
// ------------------------------------------------------------
const buildDocDefinition = (
  pages: ReportPage[],
  diagramImg: string | null | undefined,
  images: { shield?: string; mascot?: string }
) => {
  const todayStr = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const body: any[] = [];

  // ------------------------------------------------------------------
  // COVER PAGE – marketing splash
  // ------------------------------------------------------------------
  // full-page light blue rectangle background (relative to top-left)
  body.push({
    canvas:[{ type:'rect', x:0, y:0, w:595, h:842, color:'#DBEAFE' }],
    absolutePosition:{x:0, y:0}
  });

  body.push({
    table: { widths: ['auto', '*'], body: [[
      images.mascot ? { image: 'mascot', fit: [70, 70] } : '',
      { text: 'SECURETRACK SECURITY ASSESSMENT REPORT', style: 'coverBig', alignment: 'left' }
    ]]},
    layout:'noBorders',
    margin:[-40, 20, -40, 10]
  });

  body.push({ text: 'Comprehensive, AI-driven analysis and actionable recommendations to harden your architecture.', alignment: 'center', style: 'coverTagline', margin: [0, 20, 0, 0] });
  body.push({ text: [
      'Powered by ',
      {text:'Indrasol', link:'https://indrasol.com', color:'#2563eb'},
      ' • SecureTrack'
    ], alignment:'center', style:'coverFoot', margin:[0,10,0,0] });

  // page break to TOC
  body.push({ text: ' ', pageBreak: 'after' });

  // ------------------------------------------------------------------
  // TABLE OF CONTENTS with banner
  // ------------------------------------------------------------------
  body.push({
    table:{ widths:['*'], body:[[ { text:'TABLE OF CONTENTS', style:'bannerTitle', alignment:'center', color:'#2563eb'} ]]},
    layout:'noBorders',
    fillColor:'#EAF4FD',
    margin:[-40,0,-40,10]
  });

  body.push({ toc: { titleStyle: 'tocEntry' }, pageBreak: 'after' });

  pages.forEach((p, index) => {
    // Convert markdown/HTML content for this page into pdfmake blocks.
    // For the very first section we remove the automatic pageBreak to
    // prevent an extra blank page after the table of contents.
    if (p.title === 'System Design Architecture' && diagramImg && diagramImg !== 'placeholder') {
      const blocks = sectionToBlocks(p.title, p.content);
      if (index === 0 && blocks[0] && blocks[0].pageBreak) {
        delete blocks[0].pageBreak;
      }
      body.push(
        ...blocks,
        { image: diagramImg, width: 460, margin: [0, 10, 0, 15] }
      );
    } else {
      const blocks = sectionToBlocks(p.title, p.content);
      if (index === 0 && blocks[0] && blocks[0].pageBreak) {
        delete blocks[0].pageBreak;
      }
      body.push(...blocks);
    }
  });

  return {
    pageSize: 'A4',
    pageMargins: [40, 0, 40, 60],
    images,
    header: () => null,
    footer: (currentPage: number, pageCount: number) => {
      return {
        columns: [
          {
            margin: [40, 0, 0, 20],
            fontSize: 8,
            color: '#000',
            text: [
              { text: 'SecureTrack', bold: true },
              { text: ' by ' },
              { text: 'Indrasol', link: 'https://indrasol.com', linkTarget: '_blank', color: '#2563eb', bold: true }
            ]
          },
          {
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: 'right',
            margin: [0, 0, 40, 0],
            fontSize: 8,
            bold: true,
            color: '#000'
          }
        ]
      };
    },
    defaultStyle: { fontSize: 9 },
    styles: {
      headerBannerTitle: { fontSize: 28, bold: true, color: '#2563eb' },
      headerBannerDate: { fontSize: 12, color: '#666' },
      sectionHeader: {
        fontSize: 24,
        bold: true,
        italics: true,
        color: '#2563eb',
        alignment: 'center',
        margin: [0, 12, 0, 8]
      },
      h1: { fontSize: 11, bold: true },
      h2: { fontSize: 10, bold: true },
      h3: { fontSize: 9, bold: true },
      // ------------------------------------------------------------------
      // Ensure html-to-pdfmake heading styles are tamed. The library creates
      // style names like "html-h1" etc., which default to a larger fontSize
      // if not overridden. This caused the bold attack-vector headings in the
      // "Model Attack Possibilities" section to appear larger than the
      // section banner. We explicitly map them to the same sizes as our
      // custom h1–h3 styles so overall hierarchy stays consistent.
      // ------------------------------------------------------------------
      'html-h1': { fontSize: 14, bold: true },
      'html-h2': { fontSize: 12, bold: true },
      'html-h3': { fontSize: 14,  bold: true },
      // Ensure paragraphs and list items don't default to 12 pt
      'html-p':  { fontSize: 14 },
      'html-li': { fontSize: 12 },
      'html-ul': { fontSize: 12 },
      'html-ol': { fontSize: 12 },
      tocTitle: { fontSize: 22, bold: true, margin: [0, 0, 0, 12], color: '#2563eb' },
      tocEntry: { fontSize: 12, margin: [0, 2, 0, 2], color: '#2563eb' },
      bannerTitle: { fontSize: 24, bold: true, italics: true },
      bannerDate: { fontSize: 10 },
      coverBig: { fontSize: 26, bold: true, color: '#1e3a8a', italics: true },
      coverTagline: { fontSize: 14, color: '#475569' },
      coverFoot: { fontSize: 10, color: '#0f172a' },
    },
    content: body
  } as any;
};

// ------------------------------------------------------------
// Public API – backward compatible with old jsPDF usage
// ------------------------------------------------------------
export const generatePDF = (reportPages: ReportPage[], diagramImage: string | null) => {
  // Omit optional pages that user does not want in this version
  const filteredPages = reportPages.filter(
    (p) => !['Key Risk Areas', 'Data-flow Diagram', 'Data Flow Description', 'Data Flow Diagram', 'Entry Point'].includes(p.title)
  );
  // We return an object with a save method that lazily loads assets, builds the
  // doc definition and triggers the download. This keeps the public API
  // unchanged while allowing async preparation internally.

  return {
    save: async (fileName: string) => {
      try {
        // Ensure icons are available in base-64 form.
        await loadAssets();

        const docDefinition = buildDocDefinition(filteredPages, diagramImage, assetCache);

        pdfMake.createPdf(docDefinition).download(fileName);
      } catch (err) {
        // Fallback: generate without images if asset load fails
        console.warn('PDF icon preload failed, generating without icons', err);
        const docDefinition = buildDocDefinition(filteredPages, diagramImage, {});
        pdfMake.createPdf(docDefinition).download(fileName);
      }
    }
  };
};

export const addReportPage = (
  pages: ReportPage[], 
  newPage: ReportPage
): ReportPage[] => {
  return [...pages, newPage];
};

export const moveReportPage = (
  pages: ReportPage[], 
  fromIndex: number, 
  toIndex: number
): ReportPage[] => {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= pages.length || toIndex >= pages.length) {
    return pages;
  }
  
  const result = [...pages];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  
  return result;
};

export const deleteReportPage = (
  pages: ReportPage[], 
  index: number
): ReportPage[] => {
  if (index < 0 || index >= pages.length) {
    return pages;
  }
  
  const result = [...pages];
  result.splice(index, 1);
  
  return result;
};

export const generateTableOfContents = (pages: ReportPage[]): string => {
  let tableOfContents = "Table of Contents\n\n";
  
  pages.forEach((page, index) => {
    tableOfContents += `${index + 1}. ${page.title}\n`;
  });
  
  return tableOfContents;
};

export const addSubsectionAfterParent = (
  pages: ReportPage[], 
  parentIndex: number,
  newSubsection: ReportPage
): ReportPage[] => {
  const result = [...pages];
  
  // Find the last subsection of this parent, if any
  const lastSubsectionIndex = findLastSubsectionIndex(pages, parentIndex);
  
  // If we found a last subsection, insert after it
  // Otherwise, insert right after the parent
  const insertIndex = lastSubsectionIndex !== -1 ? lastSubsectionIndex + 1 : parentIndex + 1;
  
  // Insert the subsection
  result.splice(insertIndex, 0, newSubsection);
  
  return result;
};

// Helper function to find the last subsection of a parent
const findLastSubsectionIndex = (pages: ReportPage[], parentIndex: number): number => {
  // Get parent title to identify its subsections
  const parentTitle = pages[parentIndex]?.title;
  if (!parentTitle) return -1;
  
  // Start from the parent and look for the last consecutive subsection
  let lastIndex = parentIndex;
  
  for (let i = parentIndex + 1; i < pages.length; i++) {
    // Stop if we encounter another main section (not a subsection of this parent)
    const isMainSection = ["Project Description", "System Architecture Diagram", 
                          "Data-flow Diagram", "Entry Point", "Model Attack Possibilities", 
                          "Key Risk Areas"].includes(pages[i].title);
    
    if (isMainSection) {
      break;
    }
    
    // If we're dealing with Key Risk Areas, only High/Medium/Low Risks are valid subsections
    if (parentTitle === "Key Risk Areas") {
      if (["High Risks", "Medium Risks", "Low Risks"].includes(pages[i].title)) {
        lastIndex = i;
      } else {
        break;
      }
    } else {
      // For other sections, consider any non-main section as a subsection
      lastIndex = i;
    }
  }
  
  return lastIndex;
};

// -----------------------------------------------------------------------------
// Asset handling – load mascot + shield icons once per session as DataURLs
// -----------------------------------------------------------------------------

let assetCache: { shield?: string; mascot?: string } = {};
let assetPromise: Promise<void> | null = null;

const getBase64 = (url: string): Promise<string> =>
  fetch(url)
    .then((r) => r.blob())
    .then(
      (b) =>
        new Promise<string>((res) => {
          const fr = new FileReader();
          fr.onload = () => res(fr.result as string);
          fr.readAsDataURL(b);
        })
    );

const loadAssets = async () => {
  if (assetCache.shield && assetCache.mascot) return; // already loaded
  if (!assetPromise) {
    assetPromise = Promise.all([
      getBase64('/favicon.ico'), // left shield icon
      getBase64('/indrabot-mascot.png') // right mascot
    ]).then(([shield64, mascot64]) => {
      assetCache = { shield: shield64, mascot: mascot64 };
    });
  }
  return assetPromise;
};
