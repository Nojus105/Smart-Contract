# Freelance Escrow DApp - Išmanioji Sutartis su Decentralizuota Aplikacija

## 📋 Projekto Aprašymas

Šis projektas yra decentralizuota freelance escrow (garantinio depozito) sistema, sukurta Ethereum blockchain platformoje. Sistema leidžia klientams ir freelanceriams saugiai bendradarbiauti, užtikrinant skaidrumą, patikimumą ir apsaugą abiem šalims per išmaniąsias sutartis.

### 🎯 Tikslas

Sukurti išmaniąją sutartį ir decentralizuotą aplikaciją, kuri:
- Įgyvendina saugų mokėjimo valdymą tarp kliento ir freelancerio
- Palaiko etapinį (milestone-based) darbo apmokėjimą
- Užtikrina ginčų sprendimo mechanizmą per neutralų arbitrą
- Apsaugo abi šalis nuo sukčiavimo ir nesąžiningumo
- Automatizuoja mokėjimus ir sutarčių vykdymą be tarpininkų

---

## 👥 Verslo Modelis

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

#### 1️⃣ **Projekto Sukūrimas**
- Klientas sukuria naują projektą, nurodydamas:
  - Freelancerio adresą
  - Arbitro adresą
  - Projekto aprašymą
  - Terminą (deadline)
- Sistema priskiria unikalų projekto ID

#### 2️⃣ **Etapų Pridėjimas**
- Klientas prideda projekto etapus (milestones):
  - Kiekvienas etapas turi aprašymą
  - Kiekvienas etapas turi priskirta sumą (ETH)
  - Galima pridėti kelis etapus
- Sistema suskaičiuoja bendrą projekto vertę

#### 3️⃣ **Projekto Pradžia ir Finansavimas**
- Klientas įneša visą projekto sumą + 2% arbitro mokestį į escrow sutartį
- Lėšos užšaldomas išmaniojoje sutartyje
- Projekto statusas keičiamas į "InProgress"

#### 4️⃣ **Darbo Atlikimas ir Pateikimas**
- Freelanceris atlieka darbą pagal etapą
- Freelanceris pateikia atliktą darbą su įrodymais (deliverable hash)
- Etapo statusas keičiamas į "Submitted"
- Laikmačiai pradeda skaičiuoti 7 dienų patvirtinimo terminą

#### 5️⃣ **Etapo Patvirtinimas - Normalus Scenarijus**
- Klientas peržiūri pateiktą darbą
- Jei darbas atitinka reikalavimus:
  - Klientas patvirtina etapą
  - Sistema automatiškai perveda ETH freelanceriui
  - Etapo statusas: "Approved"

#### 6️⃣ **Auto-Patvirtinimas**
- Jei klientas nereaguoja per 7 dienas po darbo pateikimo
- Bet kas gali iškviesti auto-patvirtinimo funkciją
- Sistema automatiškai perveda mokėjimą freelanceriui
- Tai apsaugo freelancerį nuo neaktyvių klientų

#### 7️⃣ **Ginčų Scenarijus**
- Jei klientas nesutinka su rezultatu:
  - Klientas ginčija etapą (disputes milestone)
  - Projekto statusas keičiamas į "Disputed"
  - Arbitras yra informuojamas

#### 8️⃣ **Ginčo Sprendimas**
- Arbitras peržiūri projekto informaciją ir įrodymus
- Arbitras priima sprendimą:
  - **Už freelancerį**: mokėjimas pervediamas freelanceriui
  - **Už klientą**: etapas grąžinamas į "Pending" būseną, freelanceris turi pataisyti
- Arbitras gauna savo mokestį (2%)
- Projektas grąžinamas į "InProgress" statusą

#### 9️⃣ **Projekto Užbaigimas**
- Kai visi etapai patvirtinti:
  - Projekto statusas keičiamas į "Completed"
  - Jei arbitras nebuvo panaudotas, jam vis tiek išmokamas mokestis
  - Sutartis uždaroma

#### 🔟 **Atšaukimo Scenarijai**
- **Prieš pradžią**: Klientas gali atšaukti projektą be nuobaudų
- **Vykdymo metu**: Abi šalys gali susitarti ir gauti grąžinimą už neužbaigtus etapus

---

## 🔄 Sekų Diagrama (Sequence Diagram)

### Normalus Darbo Eigos Scenarijus

```
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

```
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

```
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

## 🎨 Išmaniosios Sutarties Funkcionalumas

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

✅ **Access Control**: Kiekviena funkcija turi modifier'ius, kontroliuojančius, kas gali ją iškviesti  
✅ **Reentrancy Protection**: Pirmiau keičiamas state, paskui siunčiami ETH  
✅ **Validation**: Visos įvestys yra validuojamos  
✅ **Status Checks**: Funkcijos veikia tik esant tam tikram projekto statusui  
✅ **Time Locks**: Auto-patvirtinimas po 7 dienų apsaugo freelancerius  
✅ **Events**: Visi svarbūs veiksmai logginami event'ais  

---

## 🚀 Projekto Struktūra

```
Smart-Contract/
├── contracts/
│   ├── FreelanceEscrow.sol      # Pagrindinė išmanioji sutartis
│   └── Migrations.sol            # Truffle migrations sutartis
├── migrations/
│   ├── 1_initial_migration.js    # Pradinis migration
│   └── 2_deploy_contracts.js     # FreelanceEscrow deployment
├── client/                       # Front-End DApp (React)
│   ├── public/
│   ├── src/
│   │   ├── components/          # React komponentai
│   │   ├── contracts/           # ABI failai
│   │   ├── utils/               # Web3 utilities
│   │   └── App.jsx              # Pagrindinis komponentas
│   └── package.json
├── test/                        # Unit testai
├── truffle-config.js            # Truffle konfigūracija
├── package.json
└── README.md                    # Šis failas
```

---

## 🛠️ Technologijos

### Smart Contract
- **Solidity 0.8.19** - Išmaniosios sutarties kalba
- **OpenZeppelin** - Saugūs library'ai
- **Truffle** - Development framework
- **Ganache** - Lokalus Ethereum tinklas

### Front-End
- **React 18** - UI framework
- **Vite** - Build tool
- **Web3.js / Ethers.js** - Ethereum sąsaja
- **TailwindCSS** - Styling
- **MetaMask** - Wallet integration

### Testing & Deployment
- **Mocha/Chai** - Testavimo framework
- **Sepolia Testnet** - Testinis Ethereum tinklas
- **Infura** - Ethereum node provider
- **Etherscan** - Blockchain explorer

---

## 📦 Instaliacija ir Paleidimas

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

# Sukurti .env failą iš pavyzdžio
cp .env.example .env

# Redaguoti .env failą ir įrašyti:
# - Savo wallet mnemonic
# - Infura API key
# - Etherscan API key
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
# Paleisti Ganache (kitame terminale arba GUI)
ganache-cli

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

# Verifikuoti sutartį Etherscan
npm run verify
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

---

## 🧪 Testavimas

### Unit Testai

```bash
# Paleisti visus testus
npm test

# arba
truffle test

# Paleisti konkretu testą
truffle test test/FreelanceEscrow.test.js
```

### Testavimo Scenarijai

✅ Projekto sukūrimas  
✅ Etapų pridėjimas  
✅ Finansavimas ir projekto pradžia  
✅ Darbo pateikimas  
✅ Etapo patvirtinimas ir mokėjimas  
✅ Auto-patvirtinimas po deadline  
✅ Ginčų kūrimas ir sprendimas  
✅ Projekto atšaukimas  
✅ Grąžinimas  
✅ Access control patikrinimas  

---

## 📊 Etherscan Logų Peržiūra

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

---

## 🎮 Front-End Funkcionalumas

### Minimumas (Plan Minimum)

✅ **Wallet Prijungimas**
- MetaMask integracija
- Tinklo pasirinkimas (Ganache/Sepolia)
- Balance rodymas

✅ **Klientui**
- Projekto kūrimas
- Etapų pridėjimas
- Projekto finansavimas
- Etapų patvirtinimas/ginčijimas
- Projekto būsenos peržiūra

✅ **Freelanceriui**
- Projektų sąrašas
- Darbo pateikimas su hash
- Mokėjimų istorija

✅ **Arbitrui**
- Ginčijamų projektų sąrašas
- Ginčų sprendimas

### Maximum (Papildomai +1 balas)

🌟 **Pažangios Funkcijos**
- Dashboard su statistika
- Real-time notification sistema
- IPFS integracija failų upload'ui
- Projekto search ir filtravimas
- Chat funkcionalumas tarp šalių
- Rating sistema
- Multi-language support (LT/EN)
- Dark/Light theme
- Mobile responsive design
- Transaction istorijos eksportavimas
- Email/Push notifications
- Profile management
- Advanced analytics ir charts

---

## 📈 Vertinimo Kriterijai

### Privaloma Dalis (iki 3 balų)

✅ Unikalus verslo modelis (ne pavyzdinis)  
✅ Išsamus verslo modelio aprašymas GitHub  
✅ Sekų diagrama su aprašymais  
✅ Išmanioji sutartis Solidity  
✅ Veikiantis lokalus testavimas  
✅ Deployment į Sepolia testnet  
✅ Etherscan logų peržiūra  
✅ Minimalistinis Front-End  

### Papildoma Dalis (iki +1.5 balo)

🌟 Kokybiškas verslo modelio aprašymas (+0.5)  
🌟 Pažangus Front-End funkcionalumas (+1.0)  

### Vertinami Aspektai

- **Verslo logikos sudėtingumas** - Kiek šalių, scenarijai
- **Smart contract kokybė** - Saugumas, optimizacija, komentarai
- **Testavimo išsamumas** - Unit testai, scenarijai
- **Front-End funkcionalumas** - UX/UI, features
- **Dokumentacijos kokybė** - README, komentarai, diagramos
- **Code style** - Tvarkingumas, best practices

---

## 🔐 Saugumo Aspektai

### Įgyvendinti Saugos Mechanizmai

1. **Access Control**
   - `onlyClient`, `onlyFreelancer`, `onlyArbiter` modifiers
   - Užtikrina, kad funkcijas kviečia tik įgalioti vartotojai

2. **Reentrancy Protection**
   - State keičiamas prieš ETH pervedimą
   - Naudojamas Checks-Effects-Interactions pattern

3. **Input Validation**
   - Visi adresai tikrinami
   - Sumos validuojamos (> 0)
   - Deadline patikrinimas

4. **Status Management**
   - Griežta projekto būsenų kontrolė
   - Funkcijos veikia tik teisinguose statusuose

5. **Time-based Protection**
   - 7 dienų auto-approval apsaugo freelancerius
   - Deadline patikrinimas projekto kūrime

6. **Event Logging**
   - Visi kritiniai veiksmai logginami
   - Užtikrina transparency ir auditability

---

## 🤝 Komandos Nariai

- **[Vardas Pavardė]** - Smart Contract Development, Testing
- **[Vardas Pavardė]** - Front-End Development, UI/UX Design

---

## 📝 Licencija

MIT License - Laisvas naudojimas edukaciniais tikslais

---

## 📚 Šaltiniai ir Nuorodos

### Dokumentacija
- [Solidity Docs](https://docs.soliditylang.org/)
- [Truffle Suite](https://trufflesuite.com/docs/)
- [Web3.js Docs](https://web3js.readthedocs.io/)
- [Ethereum.org](https://ethereum.org/en/developers/)

### Tutorialai
- [CryptoZombies](https://cryptozombies.io/)
- [Ethereum DApp University](https://www.dappuniversity.com/)
- [Coursera Blockchain Specialization](https://www.coursera.org/specializations/blockchain)

### Tools
- [Remix IDE](https://remix.ethereum.org/)
- [Ganache](https://trufflesuite.com/ganache/)
- [MetaMask](https://metamask.io/)
- [Sepolia Faucet](https://sepoliafaucet.com/)
- [Sepolia Etherscan](https://sepolia.etherscan.io/)

---

## 🎯 Išvados

Ši Freelance Escrow sistema demonstruoja, kaip blockchain technologija gali išspręsti realias pasaulio problemas:

1. **Pasitikėjimo trūkumas** - Išmanioji sutartis veikia kaip neutralus tarpininkas
2. **Mokėjimų saugumas** - Lėšos laikomos escrow iki darbo patvirtinimo
3. **Ginčų sprendimas** - Decentralizuotas arbitražas
4. **Automatizacija** - Mokėjimai ir sutarčių vykdymas be žmogiškos intervencijos
5. **Transparency** - Visi veiksmai matomi blockchain'e
6. **Immutability** - Negalima pakeisti praeities įrašų

Sistema yra tinkama realiam naudojimui ir gali būti lengvai išplėsta su papildomomis funkcijomis.

---

**Projektas parengtas VU Blockchain kurso 4-ajam laboratoriniam darbui**  
**Data: 2025-12-17**