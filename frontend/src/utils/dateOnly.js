// Campos vindos da API no formato "YYYY-MM-DD" (sem hora) representam uma
// data de calendário, não um instante. `new Date("YYYY-MM-DD")` interpreta a
// string como UTC meia-noite, e `.toLocaleDateString()` a converte de volta
// para o fuso local — em fusos negativos (ex. Brasil, UTC-3) isso exibe o dia
// anterior. Estas funções constroem a data em horário local para evitar o shift.

function parseDateOnly(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatDateOnly(value) {
  const date = parseDateOnly(value);
  return date ? date.toLocaleDateString("pt-BR") : "";
}

export function isDateOnlyExpired(value) {
  const date = parseDateOnly(value);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}
