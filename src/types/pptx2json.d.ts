declare module "pptx2json" {
  function pptx2json(buffer: Buffer): Promise<any>;
  export = pptx2json;
}
