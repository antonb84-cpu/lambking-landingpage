const ANALYTICS_PRIVACY = `4. Anonyme Reichweitenmessung und Amazon-Klickstatistik

Zur rein statistischen Auswertung erfassen wir die Anzahl der Aufrufe dieser Landingpage und die Anzahl der Klicks auf die Amazon-Schaltfläche des jeweiligen Buches. Unsere Anwendung speichert dabei ausschließlich zusammengefasste Zählerstände pro Kalendertag und Ereignis beziehungsweise interner Buch-ID. Wir setzen hierfür keine Cookies oder vergleichbaren Wiedererkennungstechniken ein, speichern keine Kennungen im Browser, erstellen keine Nutzerprofile und führen einzelne Aufrufe nicht zu einem Besucherverlauf zusammen.

Bei der Übermittlung an den von Cloudflare bereitgestellten Zähldienst wird die IP-Adresse technisch als Verbindungsdatum übertragen. Sie wird von unserer Zähleranwendung weder ausgelesen noch in der Zählerdatenbank gespeichert. Die automatischen Aufrufprotokolle des Workers sind deaktiviert. Anbieter der technischen Infrastruktur ist Cloudflare, Inc., 101 Townsend St, San Francisco, CA 94107, USA. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO; unser berechtigtes Interesse liegt in der anonymen Reichweiten- und Erfolgsmessung unserer Website.

5. Keine Cookies und keine Wiedererkennung

Diese Website verwendet keine Cookies und keine Analyse- oder Marketingtechnik zur Wiedererkennung von Besuchern. Schriftarten werden lokal von dieser Website geladen, nicht von externen Diensten.`

export function withAnalyticsPrivacy(value) {
  if (value.includes('Anonyme Reichweitenmessung und Amazon-Klickstatistik')) return value
  const oldPrivacyPattern = /4\. Keine Cookies, kein Tracking\r?\n\r?\nDiese Website verwendet keine Cookies und keine Analyse- oder Marketing-Dienste\. Schriftarten werden lokal von dieser Website geladen, nicht von externen Diensten\./
  let updated
  if (oldPrivacyPattern.test(value)) {
    updated = value.replace(oldPrivacyPattern, ANALYTICS_PRIVACY)
  } else if (/\r?\n\r?\n5\. Externe Links/.test(value)) {
    updated = value.replace(/\r?\n\r?\n5\. Externe Links/, `\n\n${ANALYTICS_PRIVACY}\n\n5. Externe Links`)
  } else {
    updated = `${value.trim()}\n\n${ANALYTICS_PRIVACY}`
  }
  return updated
    .replace(/\r?\n\r?\n5\. Externe Links/, '\n\n6. Externe Links')
    .replace(/\r?\n\r?\n6\. Kontaktaufnahme per E-Mail/, '\n\n7. Kontaktaufnahme per E-Mail')
    .replace(/\r?\n\r?\n7\. Ihre Rechte/, '\n\n8. Ihre Rechte')
    .replace(/Stand: August 2026/g, 'Stand: September 2026')
}
