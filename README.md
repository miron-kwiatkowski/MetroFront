# MetroFront

Frontend do projektu schematów (metro / transport), napisany w **React + TypeScript + Vite**.

## Uruchomienie

1) Skopiuj plik `.env.example` jako `.env` i ustaw adres backendu:

```bash
cp .env.example .env
```

2) Zainstaluj zależności i uruchom dev serwer:

```bash
npm install
npm run dev
```

Domyślny adres frontendu: `http://localhost:5173`.

## Funkcje (MVP)

- logowanie/rejestracja (także Facebook/Google jeśli backend jest skonfigurowany),
- lista schematów + tworzenie schematu,
- widok schematu: canvas do rozmieszczania stacji (drag&drop, zapis pozycji),
- CRUD stacji (dodawanie, edycja, usuwanie),
- dodawanie linii,
