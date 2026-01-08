# Sundsvalls kommun Draken admin

## APIer som används

Dessa APIer används i projektet, applikationsanvändaren i WSO2 måste prenumerera på dessa. Systemet utgår ifrån /backend/api-config.ts där dessa står specificerade.

| API               | Version |
| ------------------| ------: |
| SimulatorServer   |     2.0 |
| SupportManagement |    12.2 |
| Templating        |     2.0 |

## Utveckling

### Krav

- Node >= 20 LTS
- Yarn

### Steg för steg

1. Klona ner repot.

```
git clone git@github.com:Sundsvallskommun/web-app-draken-admin.git
```

2. Installera dependencies för både `backend` och `admin`

```
cd admin
yarn install

cd backend
yarn install
```

3. Skapa .env-fil för `admin`

```
cd admin
cp .env-example .env
```

Redigera `.env` för behov, för utveckling bör exempelvärdet fungera.

4. Skapa .env-fil för `backend`

```
cd backend
cp .env.example.local .env.development.local
cp .env.example.local .env.test.local
```

redigera `.env.development.local` för behov. URLer, nycklar och cert behöver fyllas i korrekt.

- `CLIENT_KEY` och `CLIENT_SECRET` måste fyllas i för att APIerna ska fungera, du måste ha en applikation från WSO2-portalen som abonnerar på de microtjänster du anropar
- `SAML_ENTRY_SSO` behöver pekas till en SAML IDP
- `SAML_IDP_PUBLIC_CERT` ska stämma överens med IDPens cert
- `SAML_PRIVATE_KEY` och `SAML_PUBLIC_KEY` behöver bara fyllas i korrekt om man kör mot en riktig IDP

5. Initiera databas för backend

```
cd backend
yarn prisma:generate
yarn prisma:migrate
```