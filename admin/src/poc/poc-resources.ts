/**
 * Static data for the shadcn PoC. Mirrors the real `@config/resources` nav and
 * the `statuses` resource shape, but with hardcoded Swedish labels and mock
 * rows so the PoC renders standalone (no backend / i18n / zustand wiring).
 */
import {
  Boxes,
  Braces,
  CircleDot,
  FileText,
  Flag,
  FolderTree,
  Mail,
  MessageSquare,
  Tags,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface PocResource {
  name: string;
  label: string;
  description: string;
  icon: LucideIcon;
  canCreate: boolean;
}

export const pocResources: PocResource[] = [
  { name: 'featureFlags', label: 'Feature-flaggor', description: 'Slå på och av funktioner per namespace.', icon: Flag, canCreate: true },
  { name: 'labels', label: 'Etiketter', description: 'Hierarki av etiketter för ärenden.', icon: Tags, canCreate: false },
  { name: 'roles', label: 'Roller', description: 'Behörighetsroller per namespace.', icon: Users, canCreate: true },
  { name: 'statuses', label: 'Statusar', description: 'Ärendestatusar och visningsnamn.', icon: CircleDot, canCreate: true },
  { name: 'contactReasons', label: 'Kontaktorsaker', description: 'Orsaker till kontakt per namespace.', icon: MessageSquare, canCreate: true },
  { name: 'categories', label: 'Kategorier', description: 'Ärendekategorier och typer.', icon: FolderTree, canCreate: true },
  { name: 'emailIntegration', label: 'E-postintegration', description: 'Inställningar för inkommande e-post.', icon: Mail, canCreate: false },
  { name: 'namespaces', label: 'Namespaces', description: 'Verksamhetsområden i Draken.', icon: Boxes, canCreate: true },
  { name: 'templates', label: 'Mallar', description: 'Dokument- och meddelandemallar.', icon: FileText, canCreate: true },
  { name: 'jsonSchemas', label: 'JSON-scheman', description: 'Versionerade JSON-scheman.', icon: Braces, canCreate: true },
];

export interface Status {
  id: string;
  name: string;
  displayName: string;
  externalDisplayName: string;
  namespace: string;
  updatedAt: string;
}

const baseStatuses: Status[] = [
  { id: 'CONTACT', name: 'CONTACT', displayName: 'Återkoppling', externalDisplayName: 'Vi återkommer', namespace: 'CONTACTCENTER', updatedAt: '2026-05-12' },
  { id: 'NEW', name: 'NEW', displayName: 'Nytt ärende', externalDisplayName: 'Mottaget', namespace: 'CONTACTCENTER', updatedAt: '2026-05-30' },
  { id: 'ONGOING', name: 'ONGOING', displayName: 'Pågående', externalDisplayName: 'Under handläggning', namespace: 'CONTACTCENTER', updatedAt: '2026-06-01' },
  { id: 'SOLVED', name: 'SOLVED', displayName: 'Avslutat', externalDisplayName: 'Klart', namespace: 'CONTACTCENTER', updatedAt: '2026-06-10' },
  { id: 'PENDING', name: 'PENDING', displayName: 'Väntar på svar', externalDisplayName: 'Inväntar dig', namespace: 'BYGGLOV', updatedAt: '2026-04-22' },
  { id: 'ASSIGNED', name: 'ASSIGNED', displayName: 'Tilldelat', externalDisplayName: 'Handläggare utsedd', namespace: 'BYGGLOV', updatedAt: '2026-06-14' },
  { id: 'REJECTED', name: 'REJECTED', displayName: 'Avvisat', externalDisplayName: 'Avslaget', namespace: 'BYGGLOV', updatedAt: '2026-03-18' },
  { id: 'SUSPENDED', name: 'SUSPENDED', displayName: 'Parkerat', externalDisplayName: 'Pausat', namespace: 'MEX', updatedAt: '2026-06-16' },
];

// Extra rader så sidstorleks-väljaren (10/20/50/Alla) blir meningsfull i PoC:n.
const fillerStatuses: Status[] = Array.from({ length: 22 }, (_, i) => {
  const ns = ['CONTACTCENTER', 'BYGGLOV', 'MEX'][i % 3];
  const n = i + 1;
  return {
    id: `STATUS_${n}`,
    name: `STATUS_${n}`,
    displayName: `Status ${n}`,
    externalDisplayName: `Extern status ${n}`,
    namespace: ns,
    updatedAt: `2026-0${(i % 6) + 1}-${String((i % 27) + 1).padStart(2, '0')}`,
  };
});

export const mockStatuses: Status[] = [...baseStatuses, ...fillerStatuses];

export const pocNamespaces = [
  { namespace: 'CONTACTCENTER', displayName: 'Kontaktcenter' },
  { namespace: 'BYGGLOV', displayName: 'Bygglov' },
  { namespace: 'MEX', displayName: 'Mark och exploatering' },
];
