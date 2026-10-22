export const MUNICIPALITIES = [
  { id: 2281, name: 'Sundsvall' },
  { id: 2260, name: 'Ånge' },
];

export const municipalityName = (municipalityId: number): string =>
  MUNICIPALITIES.find((municipality) => municipality.id === municipalityId)?.name ?? String(municipalityId);
