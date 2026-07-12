export interface ICertificateRenderer {
  render(template: any, inputs: Record<string, any>[]): Promise<Uint8Array>;
}
