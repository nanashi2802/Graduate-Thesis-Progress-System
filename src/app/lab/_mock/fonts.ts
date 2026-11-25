// Lab-only: candidate fonts for the typography review (owner request, UX-P-01 revision).
// All are SIL Open Font License fonts that next/font self-hosts (NFR-06). Only /lab loads them.
import {
  IBM_Plex_Mono,
  Inter,
  JetBrains_Mono,
  Poppins,
  Source_Serif_4,
  IBM_Plex_Sans,
  Atkinson_Hyperlegible_Mono,
  Atkinson_Hyperlegible_Next,
  Newsreader,
  Public_Sans,
  Source_Code_Pro,
  Source_Sans_3,
} from "next/font/google";

// Brand guide fonts (UX-D-11 item 3): Poppins for titles and headings, Inter for text and UI, JetBrains Mono for data.
export const poppins = Poppins({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-lab-poppins" });
export const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-lab-inter" });
export const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-lab-jetbrains" });
// Source Serif 4 again, so the older comparison sets keep their title font inside the brand wrapper.
export const sourceSerif = Source_Serif_4({ subsets: ["latin"], weight: ["600"], variable: "--font-lab-source-serif" });
// Set A (the old fonts), loaded again so the comparison works inside the set-B lab wrapper.
export const plexSans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-lab-plex-sans" });
export const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-lab-plex-mono" });
export const sourceSans = Source_Sans_3({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-lab-source-sans" });
export const sourceCode = Source_Code_Pro({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-lab-source-code" });
export const publicSans = Public_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-lab-public-sans" });
export const newsreader = Newsreader({ subsets: ["latin"], weight: ["600"], variable: "--font-lab-newsreader" });
export const atkinson = Atkinson_Hyperlegible_Next({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-lab-atkinson" });
export const atkinsonMono = Atkinson_Hyperlegible_Mono({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-lab-atkinson-mono" });
