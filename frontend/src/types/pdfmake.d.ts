declare module 'pdfmake/build/pdfmake' {
  const pdfMake: any;
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const pdfFonts: any;
  export default pdfFonts;
}

declare module 'md-to-pdfmake' {
  // Library exports a named function that converts markdown to pdfmake nodes
  export function toPdfMakeObject(markdown: string, options?: any): any;
}

declare module 'html-to-pdfmake' {
  const htmlToPdfmake: (html: string, options?: any) => any[];
  export default htmlToPdfmake;
}

declare module 'markdown-it'; 