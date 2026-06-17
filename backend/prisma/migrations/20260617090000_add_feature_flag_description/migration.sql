-- AlterTable
ALTER TABLE "FeatureFlags" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';

-- Backfilla beskrivningar för kända feature-flaggor (per namn, oberoende av namespace/kommun).
-- UPDATE-satser mot namn som inte finns påverkar inga rader och är ofarliga.

-- Applikationsläge
UPDATE "FeatureFlags" SET "description" = 'Kör applikationen i Case data-läge (ärende-/myndighetshantering) istället för Support Management. Styr vilken hel applikationsgren som visas.' WHERE "name" = 'isCaseData';
UPDATE "FeatureFlags" SET "description" = 'Kör applikationen i Support Management-läge (supportärenden) istället för Case data. Styr vilken hel applikationsgren som visas.' WHERE "name" = 'isSupportManagement';
UPDATE "FeatureFlags" SET "description" = 'Antal dagar efter att ett supportärende stängts som det fortfarande går att återöppna. Anges som ett antal dagar i värdefältet (t.ex. 30 eller 40).' WHERE "name" = 'reopenSupportErrandLimit';

-- Case data
UPDATE "FeatureFlags" SET "description" = 'Visar exportknappen så att ärenden kan exporteras. När av döljs exportfunktionen i sidomenyn och ärendelistan.' WHERE "name" = 'useErrandExport';
UPDATE "FeatureFlags" SET "description" = 'Aktiverar fakturering. Visar fliken Engångsfakturering på Case data-ärenden och Fakturering på supportärenden, samt attesteringstabellen i översikten.' WHERE "name" = 'useBilling';
UPDATE "FeatureFlags" SET "description" = 'Visar fliken Avtal på Case data-ärenden för de ärendetyper där avtal är tillämpligt.' WHERE "name" = 'useContracts';
UPDATE "FeatureFlags" SET "description" = 'Aktiverar fält för fastighet/anläggning på Case data-ärenden. När på kan användaren visa och redigera fastighetsuppgifter i detaljfliken.' WHERE "name" = 'useFacilities';
UPDATE "FeatureFlags" SET "description" = 'Aktiverar Mina sidor i kontakt-/intressentsektioner och i meddelandeflödet, så att kontakter kan hämtas och hanteras därifrån.' WHERE "name" = 'useMyPages';
UPDATE "FeatureFlags" SET "description" = 'Aktiverar kopplingar/relationer mellan ärenden. Visas i översikt, meddelanden och på supportärenden.' WHERE "name" = 'useRelations';
UPDATE "FeatureFlags" SET "description" = 'Gör kontaktväg till ett obligatoriskt fält i kontaktformulär. När av är kontaktväg valfritt.' WHERE "name" = 'useRequireContactChannel';
UPDATE "FeatureFlags" SET "description" = 'Aktiverar fält för extra information om intressenter på Case data-ärenden.' WHERE "name" = 'useExtraInformationStakeholders';
UPDATE "FeatureFlags" SET "description" = 'Tillåter organisationer/företag som intressenter utöver privatpersoner, samt filtrering på organisationer.' WHERE "name" = 'useOrganizationStakeholders';
UPDATE "FeatureFlags" SET "description" = 'Visar fas-/status-UI för Case data-ärenden, dvs. information om processfas med tillhörande kontroller.' WHERE "name" = 'useUiPhases';
UPDATE "FeatureFlags" SET "description" = 'Aktiverar överklagande för Case data-ärenden.' WHERE "name" = 'useAppeal';

-- Support Management
UPDATE "FeatureFlags" SET "description" = 'Aktiverar trenivåkategorisering (Kategori → Typ → Undertyp) för supportärenden, i både formulär och filter.' WHERE "name" = 'useThreeLevelCategorization';
UPDATE "FeatureFlags" SET "description" = 'Aktiverar tvånivåkategorisering (Kategori → Typ) för supportärenden, i både formulär och filter.' WHERE "name" = 'useTwoLevelCategorization';
UPDATE "FeatureFlags" SET "description" = 'Visar kryssrutan Företagsärende på supportärenden så att ärendet kan märkas som företagsrelaterat.' WHERE "name" = 'useBusinessCase';
UPDATE "FeatureFlags" SET "description" = 'Visar fältet Orsak till kontakt i supportärendets grunduppgifter.' WHERE "name" = 'useReasonForContact';
UPDATE "FeatureFlags" SET "description" = 'Visar fält och textruta för orsaksförklaring i supportärendets grunduppgifter.' WHERE "name" = 'useExplanationOfTheCause';
UPDATE "FeatureFlags" SET "description" = 'Visar fliken Ärendeuppgifter på supportärenden.' WHERE "name" = 'useDetailsTab';
UPDATE "FeatureFlags" SET "description" = 'Aktiverar överlämning/eskalering av supportärenden. När av döljs hela knappen Överlämna ärendet.' WHERE "name" = 'useEscalation';
UPDATE "FeatureFlags" SET "description" = 'Lägger till alternativet att överlämna till avdelning (via Draken) i överlämningsdialogen. När av är endast överlämning via e-post tillgänglig.' WHERE "name" = 'useDepartmentEscalation';
UPDATE "FeatureFlags" SET "description" = 'Aktiverar e-post som kontaktväg vid utskick av meddelanden på supportärenden.' WHERE "name" = 'useEmailContactChannel';
UPDATE "FeatureFlags" SET "description" = 'Aktiverar SMS som kontaktväg vid utskick av meddelanden på supportärenden.' WHERE "name" = 'useSmsContactChannel';
UPDATE "FeatureFlags" SET "description" = 'Visar kryssrutan Skicka avslutsmeddelande i dialogen för att stänga ett supportärende.' WHERE "name" = 'useClosingMessageCheckbox';
UPDATE "FeatureFlags" SET "description" = 'Sätter Stängt som förvald lösning (resolution) istället för Löst när ett supportärende stängs.' WHERE "name" = 'useClosedAsDefaultResolution';
UPDATE "FeatureFlags" SET "description" = 'Visar fliken Rekryteringsprocess på supportärenden.' WHERE "name" = 'useRecruitment';
UPDATE "FeatureFlags" SET "description" = 'Visar fliken Beslut och dokument samt tjänstesektionen på supportärenden, kopplat till huvudintressenten.' WHERE "name" = 'useServices';

-- Kontakter/intressenter
UPDATE "FeatureFlags" SET "description" = 'Aktiverar sökning efter anställda när kontakter läggs till på supportärenden.' WHERE "name" = 'useEmployeeSearch';
UPDATE "FeatureFlags" SET "description" = 'Aktiverar tilldelning av roller till intressenter på supportärenden.' WHERE "name" = 'useRolesForStakeholders';
UPDATE "FeatureFlags" SET "description" = 'Kopplar automatiskt ihop ärenden baserat på gemensamma intressenter (Kopplade ärenden). När av visas endast uttryckliga relationer.' WHERE "name" = 'useStakeholderRelations';
UPDATE "FeatureFlags" SET "description" = 'Tillåter flera kontaktvägar per intressent.' WHERE "name" = 'useMultipleContactChannels';
