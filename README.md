# Freelance Escrow DApp - Išmanioji Sutartis su Decentralizuota Aplikacija

## Projekto Aprašymas

Šis projektas yra decentralizuota freelance escrow (garantinio depozito) sistema, sukurta Ethereum blockchain platformoje. Sistema leidžia klientams ir freelanceriams saugiai bendradarbiauti, užtikrinant skaidrumą, patikimumą ir apsaugą abiem šalims per išmaniąsias sutartis.

## Greitas paleidimas

Svarbu: `compile` / `migrate:*` skriptai yra projekto šaknyje, o `client/` turi tik UI (`vite`) skriptus.

```bash
# 1) Įdiegti priklausomybes (šaknyje)
cd Smart-Contract
npm install

# 2) Įdiegti UI priklausomybes
cd client
npm install
cd ..

# 3) Kompiliuoti sutartį
npm run compile

# 4) Deploy į lokalų Ganache (GUI arba CLI turi veikti ant 127.0.0.1:7545)
npm run migrate:dev

# 5) UI paleidimas
npm run dev
```

Sepolia deployment (šaknyje):

```bash
npm run migrate:sepolia
```

- [Freelance Escrow DApp - Išmanioji Sutartis su Decentralizuota Aplikacija](#freelance-escrow-dapp---išmanioji-sutartis-su-decentralizuota-aplikacija)
  - [Projekto Aprašymas](#projekto-aprašymas)
    - [Tikslas](#tikslas)
  - [Verslo Modelis](#verslo-modelis)
    - [Pagrindiniai Veikėjai](#pagrindiniai-veikėjai)
    - [Verslo Logika](#verslo-logika)
      - [**Projekto Sukūrimas**](#projekto-sukūrimas)
      - [**Etapų Pridėjimas**](#etapų-pridėjimas)
      - [**Projekto Pradžia ir Finansavimas**](#projekto-pradžia-ir-finansavimas)
      - [**Darbo Atlikimas ir Pateikimas**](#darbo-atlikimas-ir-pateikimas)
      - [**Etapo Patvirtinimas - Normalus Scenarijus**](#etapo-patvirtinimas---normalus-scenarijus)
      - [**Auto-Patvirtinimas**](#auto-patvirtinimas)
      - [**Ginčų Scenarijus**](#ginčų-scenarijus)
      - [**Ginčo Sprendimas**](#ginčo-sprendimas)
      - [**Projekto Užbaigimas**](#projekto-užbaigimas)
      - [**Atšaukimo Scenarijai**](#atšaukimo-scenarijai)
  - [Sekų Diagrama (Sequence Diagram)](#sekų-diagrama-sequence-diagram)
    - [Normalus Darbo Eigos Scenarijus](#normalus-darbo-eigos-scenarijus)
    - [Ginčo Scenarijus](#ginčo-scenarijus)
    - [Auto-Patvirtinimo Scenarijus](#auto-patvirtinimo-scenarijus)
  - [Išmaniosios Sutarties Funkcionalumas](#išmaniosios-sutarties-funkcionalumas)
    - [Pagrindinės Funkcijos](#pagrindinės-funkcijos)
    - [Saugos Mechanizmai](#saugos-mechanizmai)
  - [Projekto Struktūra](#projekto-struktūra)
  - [Technologijos](#technologijos)
    - [Smart Contract](#smart-contract)
    - [Front-End](#front-end)
    - [Testing \& Deployment](#testing--deployment)
  - [Instaliacija ir Paleidimas](#instaliacija-ir-paleidimas)
    - [Reikalavimai](#reikalavimai)
    - [1. Projekto Paruošimas](#1-projekto-paruošimas)
    - [2. Kompiliavimas](#2-kompiliavimas)
    - [3. Lokalus Testavimas](#3-lokalus-testavimas)
    - [4. Sepolia Testnet Deployment](#4-sepolia-testnet-deployment)
    - [5. Front-End Paleidimas](#5-front-end-paleidimas)
  - [Etherscan Logų Peržiūra](#etherscan-logų-peržiūra)
    - [Svarbūs Event'ai](#svarbūs-eventai)
  - [Front-End Funkcionalumas](#front-end-funkcionalumas)
      - [Wallet Prijungimas](#wallet-prijungimas)
      - [Klientui](#klientui)
      - [Freelanceriui](#freelanceriui)
      - [Arbitrui](#arbitrui)
      - [Extra Funkcijos](#extra-funkcijos)

### Tikslas

Sukurti išmaniąją sutartį ir decentralizuotą aplikaciją, kuri:

- Įgyvendina saugų mokėjimo valdymą tarp kliento ir freelancerio
- Palaiko etapinį (milestone-based) darbo apmokėjimą
- Užtikrina ginčų sprendimo mechanizmą per neutralų arbitrą
- Apsaugo abi šalis nuo sukčiavimo ir nesąžiningumo
- Automatizuoja mokėjimus ir sutarčių vykdymą be tarpininkų

## Verslo Modelis

### Pagrindiniai Veikėjai

1. **Klientas (Client)**
   - Inicijuoja projektą ir jį finansuoja
   - Nustato projekto aprašymą, terminus ir etapus (milestones)
   - Vertina ir patvirtina freelancerio pateiktą darbą
   - Gali ginčyti rezultatus, jei jie neatitinka lūkesčių

2. **Freelanceris (Freelancer)**
   - Priima projekto užduotį
   - Atlieka darbą pagal sutartyje nustatytus etapus
   - Pateikia atliktą darbą su įrodymais (IPFS hash)
   - Gauna apmokėjimą už patvirtintus etapus

3. **Arbitras (Arbiter)**
   - Neutrali trečioji šalis ginčų sprendimui
   - Nagrinėja ginčytinus etapus ir priima sprendimą
   - Gauna kompensaciją už savo paslaugas (2% nuo projekto vertės)
   - Aktyvuojamas tik ginčų atveju

### Verslo Logika

#### **Projekto Sukūrimas**

- Klientas sukuria naują projektą, nurodydamas:
  - Freelancerio adresą
  - Arbitro adresą
  - Projekto aprašymą
  - Terminą (deadline)
- Sistema priskiria unikalų projekto ID

#### **Etapų Pridėjimas**

- Klientas prideda projekto etapus (milestones):
  - Kiekvienas etapas turi aprašymą
  - Kiekvienas etapas turi priskirta sumą (ETH)
  - Galima pridėti kelis etapus
- Sistema suskaičiuoja bendrą projekto vertę

#### **Projekto Pradžia ir Finansavimas**

- Klientas įneša visą projekto sumą + 2% arbitro mokestį į escrow sutartį
- Lėšos užšaldomas išmaniojoje sutartyje
- Projekto statusas keičiamas į "InProgress"

#### **Darbo Atlikimas ir Pateikimas**

- Freelanceris atlieka darbą pagal etapą
- Freelanceris pateikia atliktą darbą su įrodymais (deliverable hash)
- Etapo statusas keičiamas į "Submitted"
- Laikmačiai pradeda skaičiuoti 7 dienų patvirtinimo terminą

#### **Etapo Patvirtinimas - Normalus Scenarijus**

- Klientas peržiūri pateiktą darbą
- Jei darbas atitinka reikalavimus:
  - Klientas patvirtina etapą
  - Sistema automatiškai perveda ETH freelanceriui
  - Etapo statusas: "Approved"

#### **Auto-Patvirtinimas**

- Jei klientas nereaguoja per 7 dienas po darbo pateikimo
- Bet kas gali iškviesti auto-patvirtinimo funkciją
- Sistema automatiškai perveda mokėjimą freelanceriui
- Tai apsaugo freelancerį nuo neaktyvių klientų

#### **Ginčų Scenarijus**

- Jei klientas nesutinka su rezultatu:
  - Klientas ginčija etapą (disputes milestone)
  - Projekto statusas keičiamas į "Disputed"
  - Arbitras yra informuojamas

#### **Ginčo Sprendimas**

- Arbitras peržiūri projekto informaciją ir įrodymus
- Arbitras priima sprendimą:
  - **Už freelancerį**: mokėjimas pervediamas freelanceriui
  - **Už klientą**: etapas grąžinamas į "Pending" būseną, freelanceris turi pataisyti
- Arbitras gauna savo mokestį (2%)
- Projektas grąžinamas į "InProgress" statusą

#### **Projekto Užbaigimas**

- Kai visi etapai patvirtinti:
  - Projekto statusas keičiamas į "Completed"
  - Jei arbitras nebuvo panaudotas, jam vis tiek išmokamas mokestis
  - Sutartis uždaroma

#### **Atšaukimo Scenarijai**

- **Prieš pradžią**: Klientas gali atšaukti projektą be nuobaudų
- **Vykdymo metu**: Abi šalys gali susitarti ir gauti grąžinimą už neužbaigtus etapus

## Sekų Diagrama (Sequence Diagram)

### Normalus Darbo Eigos Scenarijus

```text
Klientas          Išmanioji Sutartis          Freelanceris          Arbitras
   |                      |                         |                    |
   |--createProject()---->|                         |                    |
   |                      |                         |                    |
   |--addMilestone(1)---->|                         |                    |
   |--addMilestone(2)---->|                         |                    |
   |                      |                         |                    |
   |--startProject()----->|                         |                    |
   |  (funds escrow)      |                         |                    |
   |                      |----ProjectStarted------>|                    |
   |                      |                         |                    |
   |                      |<--submitMilestone(1)----|                    |
   |<---MilestoneSubmitted|                         |                    |
   |                      |                         |                    |
   |--approveMilestone()->|                         |                    |
   |                      |------Payment----------->|                    |
   |                      |                         |                    |
   |                      |<--submitMilestone(2)----|                    |
   |<---MilestoneSubmitted|                         |                    |
   |                      |                         |                    |
   |--approveMilestone()->|                         |                    |
   |                      |------Payment----------->|                    |
   |                      |                         |                    |
   |                      |----ProjectCompleted---->|                    |
   |                      |------Arbiter Fee------->|                    |
```

### Ginčo Scenarijus

```text
Klientas          Išmanioji Sutartis          Freelanceris          Arbitras
   |                      |                         |                    |
   |                      |<--submitMilestone(1)----|                    |
   |<---MilestoneSubmitted|                         |                    |
   |                      |                         |                    |
   |--disputeMilestone()->|                         |                    |
   |                      |---MilestoneDisputed---->|                    |
   |                      |---MilestoneDisputed------------------------->|
   |                      |                         |                    |
   |                      |<--resolveDispute(approve=true)---------------|
   |                      |------Payment----------->|                    |
   |                      |------Arbiter Fee---------------------------->|
   |                      |                         |                    |
```

### Auto-Patvirtinimo Scenarijus

```text
Klientas          Išmanioji Sutartis          Freelanceris          Anyone
   |                      |                         |                    |
   |                      |<--submitMilestone(1)----|                    |
   |                      |   (7 days pass)         |                    |
   |                      |                         |                    |
   |                      |<--autoApproveMilestone()---------------------|
   |                      |------Payment----------->|                    |
   |<---MilestoneApproved-|                         |                    |
```

---

## Išmaniosios Sutarties Funkcionalumas

### Pagrindinės Funkcijos

| Funkcija | Aprašymas | Kas gali iškviesti |
|----------|-----------|-------------------|
| `createProject()` | Sukuria naują projektą | Klientas |
| `addMilestone()` | Prideda etapą prie projekto | Klientas |
| `startProject()` | Pradeda projektą ir finansuoja escrow | Klientas |
| `submitMilestone()` | Pateikia atliktą darbą | Freelanceris |
| `approveMilestone()` | Patvirtina etapą ir išmoka | Klientas |
| `autoApproveMilestone()` | Auto-patvirtinimas po 7 dienų | Bet kas |
| `disputeMilestone()` | Ginčija etapą | Klientas |
| `resolveDispute()` | Išsprendžia ginčą | Arbitras |
| `cancelProject()` | Atšaukia projektą (prieš pradžią) | Klientas |
| `requestRefund()` | Prašo grąžinti lėšas | Klientas/Freelanceris |

### Saugos Mechanizmai

 **Access Control**: Kiekviena funkcija turi modifier'ius, kontroliuojančius, kas gali ją iškviesti  
 **Reentrancy Protection**: Pirmiau keičiamas state, paskui siunčiami ETH  
 **Validation**: Visos įvestys yra validuojamos  
 **Status Checks**: Funkcijos veikia tik esant tam tikram projekto statusui  
 **Time Locks**: Auto-patvirtinimas po 7 dienų apsaugo freelancerius  
 **Events**: Visi svarbūs veiksmai logginami event'ais  

## Projekto Struktūra

```text
Smart-Contract/
├── contracts/
│   ├── FreelanceEscrow.sol      # Pagrindinė išmanioji sutartis
│   └── Migrations.sol            # Truffle migrations sutartis
├── migrations/
│   ├── 1_initial_migration.js    # Pradinis migration
│   └── 2_deploy_contracts.js     # FreelanceEscrow deployment
├── client/                       # Front-End DApp (React)
│   ├── src/
│   │   ├── context/             # Web3 context
│   │   ├── contracts/           # ABI failai
│   │   ├── App.jsx              # Pagrindinis komponentas
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
├── test/                        # Unit testai
├── truffle-config.js            # Truffle konfigūracija
├── package.json
└── README.md                    # Šis failas
```

## Technologijos

### Smart Contract

- **Solidity 0.8.19** - Išmaniosios sutarties kalba
- **Truffle** - Development framework
- **Ganache** - Lokalus Ethereum tinklas

### Front-End

- **React 18** - UI framework
- **Vite** - Build tool
- **Web3.js** - Ethereum sąsaja
- **MetaMask** - Wallet integration

### Testing & Deployment

- **Mocha/Chai** - Testavimo framework
- **Sepolia Testnet** - Testinis Ethereum tinklas
- **Infura** - Ethereum node provider
- **Etherscan** - Blockchain explorer

## Instaliacija ir Paleidimas

### Reikalavimai

- Node.js >= 16.x
- npm >= 8.x
- Truffle >= 5.x
- Ganache (GUI arba CLI)
- MetaMask browser extension

### 1. Projekto Paruošimas

```bash
# Klonuoti repozitoriją
git clone <repository-url>
cd Smart-Contract

# Įdiegti priklausomybes
npm install

# (Tik Sepolia) sukurti .env failą ir įrašyti:
# MNEMONIC="..."
# INFURA_API_KEY=...
```

### 2. Kompiliavimas

```bash
# Kompiliuoti išmaniąją sutartį
npm run compile

# arba
truffle compile
```

### 3. Lokalus Testavimas

```bash
# Paleisti Ganache (GUI arba CLI) ant 7545 porto
# (pvz. Ganache GUI: Quickstart → port 7545)

# Deplointi į lokalų tinklą
npm run migrate:dev

# arba
truffle migrate --network development
```

### 4. Sepolia Testnet Deployment

```bash
# Užsitikrinti, kad turite Sepolia ETH (per faucet)
# https://sepoliafaucet.com/

# Deplointi į Sepolia
npm run migrate:sepolia
```

### 5. Front-End Paleidimas

```bash
# Pereiti į client direktoriją
cd client

# Įdiegti priklausomybes
npm install

# Paleisti development serverį
npm run dev

# Atidaryti naršyklėje: http://localhost:5173
```

## Etherscan Logų Peržiūra

Po deployment į Sepolia testnet:

1. Eiti į [Sepolia Etherscan](https://sepolia.etherscan.io/)
2. Įvesti sutarties adresą
3. Peržiūrėti:
   - **Transactions**: Visas sutarties transakcijas
   - **Events**: Emitted events (ProjectCreated, MilestoneApproved, etc.)
   - **Internal Txns**: ETH pervedimai
   - **Contract**: Verifikuotas source code

### Svarbūs Event'ai

- `ProjectCreated` - Naujas projektas sukurtas
- `MilestoneAdded` - Etapas pridėtas
- `ProjectStarted` - Projektas pradėtas
- `MilestoneSubmitted` - Darbas pateiktas
- `MilestoneApproved` - Etapas patvirtintas
- `PaymentReleased` - Mokėjimas atliktas
- `MilestoneDisputed` - Ginčas pradėtas
- `DisputeResolved` - Ginčas išspręstas
- `ProjectCompleted` - Projektas baigtas

## Front-End Funkcionalumas

#### Wallet Prijungimas

- MetaMask integracija
- Tinklo pasirinkimas (Ganache/Sepolia)
- Balance rodymas

#### Klientui

- Projekto kūrimas
- Etapų pridėjimas
- Projekto finansavimas
- Etapų patvirtinimas/ginčijimas
- Projekto būsenos peržiūra

#### Freelanceriui

- Projektų sąrašas
- Darbo pateikimas su hash
- Mokėjimų istorija

#### Arbitrui

- Ginčijamų projektų sąrašas
- Ginčų sprendimas
- Rating sistema
- Multi-language support (LT/EN)
- Dark/Light theme
- Mobile responsive design
- Transaction istorijos eksportavimas
- Email/Push notifications
- Profile management
- Advanced analytics ir charts
