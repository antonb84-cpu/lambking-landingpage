import deFlag from 'flag-icons/flags/4x3/de.svg'
import gbFlag from 'flag-icons/flags/4x3/gb.svg'
import esFlag from 'flag-icons/flags/4x3/es.svg'
import roFlag from 'flag-icons/flags/4x3/ro.svg'
import frFlag from 'flag-icons/flags/4x3/fr.svg'
import itFlag from 'flag-icons/flags/4x3/it.svg'
import ptFlag from 'flag-icons/flags/4x3/pt.svg'
import ruFlag from 'flag-icons/flags/4x3/ru.svg'
import jpFlag from 'flag-icons/flags/4x3/jp.svg'
import cnFlag from 'flag-icons/flags/4x3/cn.svg'
import krFlag from 'flag-icons/flags/4x3/kr.svg'
import plFlag from 'flag-icons/flags/4x3/pl.svg'
import nlFlag from 'flag-icons/flags/4x3/nl.svg'
import trFlag from 'flag-icons/flags/4x3/tr.svg'
import uaFlag from 'flag-icons/flags/4x3/ua.svg'
import saFlag from 'flag-icons/flags/4x3/sa.svg'
import inFlag from 'flag-icons/flags/4x3/in.svg'
import seFlag from 'flag-icons/flags/4x3/se.svg'
import dkFlag from 'flag-icons/flags/4x3/dk.svg'
import noFlag from 'flag-icons/flags/4x3/no.svg'
import fiFlag from 'flag-icons/flags/4x3/fi.svg'

// Flaggen und Namen der Sprach-Ausgaben (im Admin auswählbar)
export const LANGUAGE_META: Record<string, { flag: string; de: string; en: string }> = {
  de: { flag: deFlag, de: 'Deutsch', en: 'German' }, en: { flag: gbFlag, de: 'Englisch', en: 'English' },
  es: { flag: esFlag, de: 'Spanisch', en: 'Spanish' }, ro: { flag: roFlag, de: 'Rumänisch', en: 'Romanian' }, fr: { flag: frFlag, de: 'Französisch', en: 'French' },
  it: { flag: itFlag, de: 'Italienisch', en: 'Italian' }, pt: { flag: ptFlag, de: 'Portugiesisch', en: 'Portuguese' },
  ru: { flag: ruFlag, de: 'Russisch', en: 'Russian' }, ja: { flag: jpFlag, de: 'Japanisch', en: 'Japanese' },
  zh: { flag: cnFlag, de: 'Chinesisch', en: 'Chinese' }, ko: { flag: krFlag, de: 'Koreanisch', en: 'Korean' },
  pl: { flag: plFlag, de: 'Polnisch', en: 'Polish' }, nl: { flag: nlFlag, de: 'Niederländisch', en: 'Dutch' },
  tr: { flag: trFlag, de: 'Türkisch', en: 'Turkish' }, uk: { flag: uaFlag, de: 'Ukrainisch', en: 'Ukrainian' },
  ar: { flag: saFlag, de: 'Arabisch', en: 'Arabic' }, hi: { flag: inFlag, de: 'Hindi', en: 'Hindi' },
  sv: { flag: seFlag, de: 'Schwedisch', en: 'Swedish' }, da: { flag: dkFlag, de: 'Dänisch', en: 'Danish' },
  no: { flag: noFlag, de: 'Norwegisch', en: 'Norwegian' }, fi: { flag: fiFlag, de: 'Finnisch', en: 'Finnish' },
}
