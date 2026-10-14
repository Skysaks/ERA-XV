/**
 * Captain of a team-era, only where one captain clearly defines that era (World Cup, Grand Slam, Lions tour or
 * title-winning season). Eras shared between several captains are left out on purpose: no guess is better than a wrong one.
 * Value = the player's person id in that team-era (checked by the tests and the data audit).
 */
export const CAPTAINS: Record<string, string> = {
  'nzl-1987': 'david-kirk', 'nzl-1996': 'sean-fitzpatrick', 'nzl-2006': 'richie-mccaw', 'nzl-2011': 'richie-mccaw', 'nzl-2015': 'richie-mccaw', 'nzl-2023': 'sam-cane',
  'rsa-1995': 'francois-pienaar', 'rsa-2008': 'john-smit', 'rsa-2019': 'siya-kolisi', 'rsa-2023': 'siya-kolisi',
  'aus-1984': 'andrew-slack', 'aus-1991': 'nick-farr-jones', 'aus-1999': 'john-eales', 'aus-2003': 'george-gregan', 'aus-2015': 'stephen-moore',
  'eng-1980': 'bill-beaumont', 'eng-1992': 'will-carling', 'eng-2003': 'martin-johnson', 'eng-2007': 'phil-vickery',
  'fra-1977': 'jacques-fouroux', 'fra-1987': 'daniel-dubroca', 'fra-2011': 'thierry-dusautoir', 'fra-2023': 'antoine-dupont',
  'irl-1985': 'ciaran-fitzgerald', 'irl-2009': 'brian-odriscoll', 'irl-2018': 'rory-best', 'irl-2023': 'johnny-sexton',
  'wal-2019': 'alun-wyn-jones', 'sco-1990': 'david-sole', 'ita-2024': 'michele-lamaro',
  'arg-2007': 'agustin-pichot', 'arg-2023': 'julian-montoya', 'fij-2007': 'mosese-rauluni', 'fij-2023': 'waisea-nayacalevu', 'sam-1991': 'peter-fatialofa',
  'jpn-2019': 'michael-leitch', 'ton-2011': 'finau-maka',
  'lions-1971': 'john-dawes', 'lions-1974': 'willie-john-mcbride', 'lions-1997': 'martin-johnson', 'lions-2009': 'paul-oconnell', 'lions-2013': 'sam-warburton', 'lions-2017': 'sam-warburton',
  'toulouse-2004': 'fabien-pelous', 'toulon-2014': 'jonny-wilkinson', 'clermont-2013': 'aurelien-rougerie',
  'leicester-2001': 'martin-johnson', 'leicester-2022': 'ellis-genge', 'wasps-2005': 'lawrence-dallaglio', 'saracens-2018': 'brad-barritt', 'northampton-2014': 'dylan-hartley', 'exeter-2020': 'joe-simmonds',
  'leinster-2011': 'leo-cullen', 'leinster-2018': 'isa-nacewa',
  'crusaders-1999': 'todd-blackadder', 'blues-1997': 'zinzan-brooke', 'bulls-2009': 'victor-matfield', 'chiefs-2012': 'craig-clarke',
};
