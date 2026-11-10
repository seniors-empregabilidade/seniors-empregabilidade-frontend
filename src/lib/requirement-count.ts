/** "2 de 3 requisitos" / "1 de 1 requisito": job requirements a profile meets. */
export function requirementCountLabel(matched: number, total: number): string {
  return `${matched} de ${total} ${total === 1 ? "requisito" : "requisitos"}`;
}
