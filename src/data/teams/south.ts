import { team } from '../schema';

/**
 * New Zealand, South Africa, Australia — national XVs.
 * Line format: Name | positions | ERA XV rating | role | [nationality] [key=value…]
 * Ratings are ERA XV game-model estimates (era-relative), not measurements.
 */
export default [
  team({ id: 'nzl-1960s', team: 'nzl', name: 'New Zealand', era: '1963–67', years: [1963, 1967], kind: 'nation', country: 'NZL', comp: 'test', color: '#e9e9e4', plan: 'pack', conf: 'medium' }, `
Don Clarke | FB | 88 | FS | gk=88
Mick Williment | FB | 80 | FS | gk=82 conf=medium
Fergie McCormick | FB | 84 | FS | gk=83
Ralph Caulton | WG | 82 | WF
Tony Steel | WG | 84 | WF pc=92
Malcolm Dick | WG | 80 | WF
Grahame Thorne | OC/WG | 83 | 13B
Ron Rangi | OC | 82 | 13D conf=medium
Ian MacRae | IC/OC | 84 | 12C
Earle Kirton | FH | 84 | 10R
Mac Herewini | FH | 83 | 10G | gk=78
Chris Laidlaw | SH | 88 | 9T
Sid Going | SH | 86 | 9S
Wilson Whineray | LHP | 88 | PS
Ken Gray | THP | 88 | PS
Bruce McLeod | HK | 84 | HS
Dennis Young | HK | 80 | HS
Colin Meads | LK | 96 | LE | short=Meads
Stan Meads | LK | 84 | LE
Kel Tremain | BF | 88 | FT
Waka Nathan | OF | 87 | FT
Ian Kirkpatrick | BF/OF | 88 | FL
Brian Lochore | N8 | 90 | NF
`),

  team({ id: 'nzl-1970s', team: 'nzl', name: 'New Zealand', era: '1972–78', years: [1972, 1978], kind: 'nation', country: 'NZL', comp: 'test', color: '#e9e9e4', plan: 'pack', conf: 'medium' }, `
Joe Karam | FB | 84 | FS | gk=85
Bryan Williams | WG | 90 | WP | short=B. Williams
Grant Batty | WG | 86 | WF
Stu Wilson | WG | 85 | WF
Bruce Robertson | OC | 88 | 13B | short=B. Robertson
Bill Osborne | IC | 84 | 12C
Duncan Robertson | FH | 83 | 10R | short=D. Robertson
Doug Bruce | FH | 82 | 10G | gk=78
Sid Going | SH | 90 | 9S
Mark Donaldson | SH | 82 | 9T
Gary Knight | LHP | 84 | PS
Brad Johnstone | LHP/THP | 83 | PS
Tane Norton | HK | 85 | HS
Kent Lambert | THP | 84 | PS
Andy Haden | LK | 88 | LE
Frank Oliver | LK | 85 | LE
Ian Kirkpatrick | BF | 91 | FL
Ken Stewart | BF | 83 | FT
Graham Mourie | OF | 89 | FJ
Andy Leslie | N8 | 86 | NF
Lawrie Knight | N8/BF | 82 | NP
Alan Sutherland | N8 | 82 | NP
`),

  team({ id: 'nzl-1987', team: 'nzl', name: 'New Zealand', era: '1987', years: [1986, 1988], kind: 'nation', country: 'NZL', comp: 'test', color: '#e9e9e4', titles: ['rwc:1987'], plan: 'balanced' }, `
John Gallagher | FB | 91 | FC
Kieran Crowley | FB | 83 | FS | gk=84
John Kirwan | WG | 93 | WP
Craig Green | WG | 86 | WF
Terry Wright | WG | 84 | WF
Joe Stanley | OC/IC | 88 | 13D
Warwick Taylor | IC | 84 | 12P
Bernie McCahill | IC | 82 | 12C
Grant Fox | FH | 90 | 10G | gk=94
Frano Botica | FH | 82 | 10G | gk=88
David Kirk | SH | 88 | 9S
Steve McDowall | LHP | 85 | PS
Sean Fitzpatrick | HK | 91 | HD
John Drake | THP | 85 | PS
Richard Loe | THP/LHP | 84 | PS
Murray Pierce | LK | 84 | LC
Gary Whetton | LK | 88 | LC
Alan Whetton | BF | 87 | FT
Andy Earl | BF | 82 | FT
Michael Jones | OF | 95 | FL | short=M. Jones
Wayne Shelford | N8 | 92 | NP
Zinzan Brooke | N8/BF | 86 | NF
`),

  team({ id: 'nzl-1996', team: 'nzl', name: 'New Zealand', era: '1995–97', years: [1995, 1997], kind: 'nation', country: 'NZL', comp: 'test', color: '#e9e9e4', plan: 'flair' }, `
Christian Cullen | FB | 93 | FC
Glen Osborne | FB/WG | 85 | FC
Jeff Wilson | WG/FB | 91 | WF | gk=78
Jonah Lomu | WG | 96 | WP
Eric Rush | WG | 83 | WF
Tana Umaga | WG/OC | 85 | WP
Frank Bunce | OC | 91 | 13D
Walter Little | IC | 88 | 12P
Alama Ieremia | IC | 84 | 12C
Andrew Mehrtens | FH | 91 | 10G | gk=92
Carlos Spencer | FH | 86 | 10R | gk=82
Graeme Bachop | SH | 87 | 9T
Justin Marshall | SH | 88 | 9S
Craig Dowd | LHP | 87 | PS
Sean Fitzpatrick | HK | 93 | HD
Norm Hewitt | HK | 80 | HS
Olo Brown | THP | 89 | PS
Ian Jones | LK | 89 | LC
Robin Brooke | LK | 88 | LE
Mike Brewer | BF | 85 | FT
Michael Jones | BF | 89 | FT | short=M. Jones
Josh Kronfeld | OF | 91 | FJ
Taine Randell | BF/N8 | 85 | FL
Zinzan Brooke | N8 | 93 | NF
`),

  team({ id: 'nzl-2006', team: 'nzl', name: 'New Zealand', era: '2005–08', years: [2005, 2008], kind: 'nation', country: 'NZL', comp: 'test', color: '#e9e9e4', titles: ['gs:2005', 'gs:2008'], plan: 'balanced' }, `
Mils Muliaina | FB/OC | 90 | FC
Leon MacDonald | FB | 86 | FS | gk=82
Doug Howlett | WG | 89 | WF
Joe Rokocoko | WG | 90 | WF
Sitiveni Sivivatu | WG | 90 | WP
Rico Gear | WG | 86 | WF
Tana Umaga | OC | 91 | 13D
Conrad Smith | OC | 88 | 13D
Aaron Mauger | IC | 88 | 12P
Ma'a Nonu | IC | 87 | 12C
Luke McAlister | IC/FH | 84 | 12P | gk=82
Dan Carter | FH | 98 | 10R | gk=94
Nick Evans | FH | 85 | 10G | gk=86
Byron Kelleher | SH | 87 | 9S
Piri Weepu | SH | 85 | 9K | gk=82
Tony Woodcock | LHP | 89 | PS
Keven Mealamu | HK | 88 | HD
Anton Oliver | HK | 86 | HS
Carl Hayman | THP | 91 | PS
Chris Jack | LK | 88 | LC
Ali Williams | LK | 88 | LA | short=A. Williams
Keith Robinson | LK | 84 | LE
Jerry Collins | BF | 90 | FT
Reuben Thorne | BF/LK | 85 | F6
Richie McCaw | OF | 97 | FJ
Chris Masoe | BF | 84 | FT
Rodney So'oialo | N8 | 88 | NP
`),

  team({ id: 'nzl-2011', team: 'nzl', name: 'New Zealand', era: '2011', years: [2010, 2011], kind: 'nation', country: 'NZL', comp: 'test', color: '#e9e9e4', titles: ['rwc:2011'], plan: 'balanced' }, `
Israel Dagg | FB | 88 | FC
Mils Muliaina | FB/OC | 87 | FC
Cory Jane | WG | 87 | WA
Richard Kahui | WG/OC | 85 | WP
Zac Guildford | WG | 83 | WF
Conrad Smith | OC | 90 | 13D
Ma'a Nonu | IC | 90 | 12C
Sonny Bill Williams | IC | 88 | 12C | short=S.B. Williams
Dan Carter | FH | 97 | 10R | gk=93
Aaron Cruden | FH | 85 | 10R | gk=80
Colin Slade | FH | 80 | 10G | gk=80
Stephen Donald | FH | 78 | 10G | gk=80
Piri Weepu | SH | 86 | 9K | gk=84
Jimmy Cowan | SH | 83 | 9S
Andy Ellis | SH | 83 | 9T
Tony Woodcock | LHP | 90 | PS
Keven Mealamu | HK | 87 | HD
Andrew Hore | HK | 86 | HD
Owen Franks | THP | 88 | PS
Brad Thorn | LK | 90 | LE
Sam Whitelock | LK | 88 | LC
Ali Williams | LK | 84 | LA | short=A. Williams
Jerome Kaino | BF | 91 | FT
Adam Thomson | BF | 83 | FL
Richie McCaw | OF | 98 | FJ
Kieran Read | N8 | 93 | NF
Victor Vito | BF/N8 | 83 | NP
`),

  team({ id: 'nzl-2015', team: 'nzl', name: 'New Zealand', era: '2015', years: [2014, 2015], kind: 'nation', country: 'NZL', comp: 'test', color: '#e9e9e4', titles: ['rwc:2015'], plan: 'flair' }, `
Ben Smith | FB/WG | 93 | FC
Nehe Milner-Skudder | WG | 88 | WF
Julian Savea | WG | 91 | WP
Waisake Naholo | WG | 85 | WP
Conrad Smith | OC | 90 | 13D
Malakai Fekitoa | OC/IC | 84 | 13B
Ma'a Nonu | IC | 92 | 12C
Sonny Bill Williams | IC | 89 | 12C | short=S.B. Williams
Dan Carter | FH | 97 | 10G | gk=93
Beauden Barrett | FH/FB | 90 | 10R | gk=80
Aaron Smith | SH | 93 | 9T
Tawera Kerr-Barlow | SH | 83 | 9S
Joe Moody | LHP | 87 | PS
Wyatt Crockett | LHP | 84 | PS
Dane Coles | HK | 90 | HD
Keven Mealamu | HK | 84 | HS
Owen Franks | THP | 89 | PS
Charlie Faumuina | THP | 84 | PC
Ben Franks | THP/LHP | 83 | PS
Brodie Retallick | LK | 94 | LA
Sam Whitelock | LK | 91 | LC
Luke Romano | LK | 83 | LE
Jerome Kaino | BF | 90 | FT
Victor Vito | BF | 83 | NP
Richie McCaw | OF | 96 | FJ
Sam Cane | OF | 87 | FT
Kieran Read | N8 | 94 | NF
`),

  team({ id: 'nzl-2023', team: 'nzl', name: 'New Zealand', era: '2022–23', years: [2022, 2023], kind: 'nation', country: 'NZL', comp: 'test', color: '#e9e9e4', plan: 'tempo' }, `
Beauden Barrett | FB/FH | 90 | FC | gk=80
Will Jordan | WG/FB | 92 | WF
Mark Tele'a | WG | 87 | WF
Leicester Fainga'anuku | WG | 85 | WP
Sevu Reece | WG | 86 | WF
Caleb Clarke | WG | 85 | WP
Rieko Ioane | OC | 88 | 13B
Anton Lienert-Brown | OC/IC | 85 | 13D
Jordie Barrett | IC | 89 | 12C | gk=84
David Havili | IC | 83 | 12P
Richie Mo'unga | FH | 90 | 10R | gk=86
Damian McKenzie | FH/FB | 85 | 10R | gk=84
Aaron Smith | SH | 91 | 9T
Cam Roigard | SH | 86 | 9S
Finlay Christie | SH | 80 | 9T
Ethan de Groot | LHP | 87 | PS
Tamaiti Williams | LHP | 83 | PC
Codie Taylor | HK | 89 | HD
Dane Coles | HK | 84 | HD
Samisoni Taukei'aho | HK | 84 | HD
Tyrel Lomax | THP | 88 | PS
Nepo Laulala | THP | 84 | PS
Fletcher Newell | THP | 82 | PS
Brodie Retallick | LK | 91 | LA
Scott Barrett | LK/BF | 89 | LE
Sam Whitelock | LK | 88 | LC
Shannon Frizell | BF | 86 | FT
Dalton Papali'i | OF/BF | 85 | FJ
Sam Cane | OF | 87 | FT
Ardie Savea | N8/OF | 95 | NP
Luke Jacobson | N8/BF | 82 | NP
`),

  team({ id: 'rsa-1995', team: 'rsa', name: 'South Africa', era: '1995', years: [1994, 1995], kind: 'nation', country: 'RSA', comp: 'test', color: '#1f9d55', titles: ['rwc:1995'], plan: 'pack' }, `
André Joubert | FB | 90 | FC
Gavin Johnson | FB | 82 | FS | gk=84
James Small | WG | 86 | WF
Chester Williams | WG | 88 | WF
Pieter Hendriks | WG | 84 | WF
Japie Mulder | OC | 86 | 13D
Hennie le Roux | IC | 85 | 12P
Brendan Venter | IC | 83 | 12C
Joel Stransky | FH | 88 | 10G | gk=88
Joost van der Westhuizen | SH | 94 | 9S
Johan Roux | SH | 80 | 9K
Os du Randt | LHP | 90 | PS
Garry Pagel | THP | 80 | PS
Chris Rossouw | HK | 83 | HS
James Dalton | HK | 82 | HD
Balie Swart | THP | 83 | PS
Kobus Wiese | LK | 87 | LE
Hannes Strydom | LK | 85 | LC
Mark Andrews | LK/N8 | 88 | LA
Francois Pienaar | BF | 90 | FT
Ruben Kruger | OF | 89 | FT
Rudolf Straeuli | N8 | 83 | NP
`),

  team({ id: 'rsa-2008', team: 'rsa', name: 'South Africa', era: '2007–09', years: [2007, 2009], kind: 'nation', country: 'RSA', comp: 'test', color: '#1f9d55', titles: ['rwc:2007', 'lions:2009'], plan: 'territory' }, `
Percy Montgomery | FB | 88 | FS | gk=91
Frans Steyn | IC/FB | 87 | 12C | gk=86
JP Pietersen | WG | 87 | WP
Bryan Habana | WG | 94 | WF | pc=98
Jaque Fourie | OC | 90 | 13D
Jean de Villiers | IC/OC | 89 | 12C
Butch James | FH | 84 | 10G | gk=76
Morné Steyn | FH | 86 | 10G | gk=92
Ruan Pienaar | SH/FH | 86 | 9K | gk=84
Fourie du Preez | SH | 95 | 9K
Ricky Januarie | SH | 83 | 9S
Os du Randt | LHP | 88 | PS
Tendai Mtawarira | LHP | 88 | PS
Gurthrö Steenkamp | LHP | 83 | PS
John Smit | HK/THP | 88 | HS
Bismarck du Plessis | HK | 91 | HD
CJ van der Linde | THP | 85 | PS
Jannie du Plessis | THP | 85 | PS
Bakkies Botha | LK | 91 | LE
Victor Matfield | LK | 94 | LC
Andries Bekker | LK | 83 | LA
Schalk Burger | BF | 92 | FT
Juan Smith | BF | 89 | FT
Heinrich Brüssow | OF | 88 | FJ
Danie Rossouw | N8/LK | 86 | NP
Pierre Spies | N8 | 86 | NP
`),

  team({ id: 'rsa-2019', team: 'rsa', name: 'South Africa', era: '2019', years: [2018, 2019], kind: 'nation', country: 'RSA', comp: 'test', color: '#1f9d55', titles: ['rwc:2019'], plan: 'territory' }, `
Willie le Roux | FB | 87 | FC
Cheslin Kolbe | WG | 93 | WF | pc=97
Makazole Mapimpi | WG | 87 | WF
Sbu Nkosi | WG | 84 | WP
Lukhanyo Am | OC | 88 | 13D
Jesse Kriel | OC | 84 | 13D
Damian de Allende | IC | 88 | 12C
Frans Steyn | IC/FB | 83 | 12C | gk=84
Handré Pollard | FH | 89 | 10G | gk=90
Elton Jantjies | FH | 82 | 10R | gk=84
Faf de Klerk | SH | 88 | 9K
Herschel Jantjies | SH | 82 | 9S
Cobus Reinach | SH | 82 | 9S
Tendai Mtawarira | LHP | 87 | PS
Steven Kitshoff | LHP | 87 | PS
Trevor Nyakane | THP/LHP | 83 | PC
Bongi Mbonambi | HK | 86 | HS
Malcolm Marx | HK | 90 | HD
Frans Malherbe | THP | 88 | PS
Vincent Koch | THP | 84 | PS
Eben Etzebeth | LK | 92 | LE
Lood de Jager | LK | 87 | LC
RG Snyman | LK | 86 | LA
Franco Mostert | LK/BF | 85 | LA
Siya Kolisi | BF | 89 | FT
Pieter-Steph du Toit | OF/BF | 94 | FT | short=P-S du Toit
Francois Louw | OF | 85 | FJ
Kwagga Smith | OF | 84 | FJ
Duane Vermeulen | N8 | 91 | NP
`),

  team({ id: 'rsa-2023', team: 'rsa', name: 'South Africa', era: '2023', years: [2022, 2023], kind: 'nation', country: 'RSA', comp: 'test', color: '#1f9d55', titles: ['rwc:2023'], plan: 'pack' }, `
Damian Willemse | FB/IC | 86 | FC
Willie le Roux | FB | 84 | FC
Kurt-Lee Arendse | WG | 88 | WF
Cheslin Kolbe | WG | 91 | WF | gk=78 pc=96
Makazole Mapimpi | WG | 86 | WF
Canan Moodie | WG | 84 | WP
Jesse Kriel | OC | 87 | 13D
Damian de Allende | IC | 89 | 12C
André Esterhuizen | IC | 84 | 12C
Handré Pollard | FH | 89 | 10G | gk=91
Manie Libbok | FH | 85 | 10R | gk=76
Faf de Klerk | SH | 87 | 9K | gk=80
Cobus Reinach | SH | 84 | 9S
Grant Williams | SH | 83 | 9S
Steven Kitshoff | LHP | 87 | PS
Ox Nché | LHP | 87 | PS
Bongi Mbonambi | HK | 86 | HS
Malcolm Marx | HK | 90 | HD
Deon Fourie | HK/OF | 82 | HD
Frans Malherbe | THP | 88 | PS
Vincent Koch | THP | 85 | PS
Trevor Nyakane | THP | 82 | PS
Eben Etzebeth | LK | 93 | LE
Franco Mostert | LK | 86 | LA
RG Snyman | LK | 88 | LA
Jean Kleyn | LK | 83 | LE
Siya Kolisi | BF | 89 | FT
Pieter-Steph du Toit | OF | 94 | FT | short=P-S du Toit
Kwagga Smith | OF/N8 | 86 | FJ
Duane Vermeulen | N8 | 88 | NP
Jasper Wiese | N8 | 85 | NP
`),

  team({ id: 'aus-1984', team: 'aus', name: 'Australia', era: '1984', years: [1984, 1984], kind: 'nation', country: 'AUS', comp: 'test', color: '#f2c230', titles: ['gs:1984'], plan: 'flair' }, `
Roger Gould | FB | 86 | FS | gk=84
David Campese | WG | 92 | WF
Brendan Moon | WG | 85 | WF
Peter Grigg | WG | 83 | WF
Andrew Slack | OC | 86 | 13D
Michael Hawker | OC/IC | 84 | 12P
Michael Lynagh | IC/FH | 88 | 12P | gk=92
Mark Ella | FH | 94 | 10R
Nick Farr-Jones | SH | 87 | 9T
Phillip Cox | SH | 82 | 9K
Enrique Rodríguez | LHP | 85 | PS
Tom Lawton | HK | 84 | HS
Andy McIntyre | THP | 84 | PS
Steve Cutler | LK | 85 | LC
Steve Williams | LK | 83 | LE | short=S. Williams
Simon Poidevin | OF | 89 | FT
David Codey | BF | 83 | FT
Chris Roche | BF | 82 | FT | conf=medium
Steve Tuynman | N8 | 85 | NF
`),

  team({ id: 'aus-1991', team: 'aus', name: 'Australia', era: '1991', years: [1990, 1992], kind: 'nation', country: 'AUS', comp: 'test', color: '#f2c230', titles: ['rwc:1991'], plan: 'flair' }, `
Marty Roebuck | FB | 85 | FS | gk=80
David Campese | WG | 95 | WF
Rob Egerton | WG | 83 | WF
Paul Carozza | WG | 82 | WF
Jason Little | OC | 88 | 13D
Anthony Herbert | IC/OC | 82 | 12C
Tim Horan | IC | 92 | 12C
Michael Lynagh | FH | 93 | 10G | gk=93
Nick Farr-Jones | SH | 92 | 9T
Peter Slattery | SH | 81 | 9S
Tony Daly | LHP | 86 | PS
Phil Kearns | HK | 89 | HD
Ewen McKenzie | THP | 88 | PS
Dan Crowley | THP | 82 | PS
Rod McCall | LK | 85 | LE
John Eales | LK | 90 | LC | gk=80
Simon Poidevin | BF | 88 | FT
Jeff Miller | OF | 84 | FJ
Willie Ofahengaue | BF | 87 | NP
Troy Coker | N8 | 84 | NP
Tim Gavin | N8 | 86 | NF
`),

  team({ id: 'aus-1999', team: 'aus', name: 'Australia', era: '1998–2000', years: [1998, 2000], kind: 'nation', country: 'AUS', comp: 'test', color: '#f2c230', titles: ['rwc:1999'], plan: 'blitz' }, `
Matt Burke | FB | 91 | FS | gk=90
Chris Latham | FB | 84 | FC
Ben Tune | WG | 88 | WP
Joe Roff | WG | 89 | WA | gk=78
Daniel Herbert | OC | 88 | 13D
Jason Little | OC | 87 | 13D
Tim Horan | IC | 93 | 12C
Nathan Grey | IC | 84 | 12C
Stephen Larkham | FH | 93 | 10R
Rod Kafer | FH/IC | 82 | 12P
George Gregan | SH | 91 | 9T
Chris Whitaker | SH | 81 | 9T
Richard Harry | LHP | 85 | PS
Michael Foley | HK | 85 | HS
Jeremy Paul | HK | 85 | HD
Andrew Blades | THP | 84 | PS
Dan Crowley | THP | 83 | PS
David Giffin | LK | 84 | LE
John Eales | LK | 95 | LC | gk=84
Matt Cockbain | BF/LK | 84 | F6
Owen Finegan | BF/N8 | 85 | NP
David Wilson | OF | 87 | FJ
Toutai Kefu | N8 | 88 | NP
`),

  team({ id: 'aus-2003', team: 'aus', name: 'Australia', era: '2001–03', years: [2001, 2003], kind: 'nation', country: 'AUS', comp: 'test', color: '#f2c230', plan: 'balanced' }, `
Chris Latham | FB | 87 | FC
Mat Rogers | FB/WG | 84 | FC | gk=80
Andrew Walker | WG/FB | 84 | WF | gk=82
Wendell Sailor | WG | 87 | WP
Lote Tuqiri | WG | 87 | WP
Joe Roff | WG | 86 | WA
Stirling Mortlock | OC | 89 | 13D | gk=85
Daniel Herbert | OC | 85 | 13D
Elton Flatley | IC | 85 | 12P | gk=86
Matt Giteau | IC/FH | 84 | 12P | gk=82
Nathan Grey | IC | 83 | 12C
Stephen Larkham | FH | 91 | 10R
George Gregan | SH | 90 | 9T
Bill Young | LHP | 84 | PS
Brendan Cannon | HK | 83 | HS
Jeremy Paul | HK | 84 | HD
Al Baxter | THP | 82 | PS
Ben Darwin | THP | 82 | PS
Justin Harrison | LK | 85 | LC
Nathan Sharpe | LK | 86 | LA
David Giffin | LK | 83 | LE
Owen Finegan | BF | 84 | FT
George Smith | OF | 92 | FJ
Phil Waugh | OF | 88 | FJ
David Lyons | N8 | 85 | NP
Toutai Kefu | N8 | 85 | NP
`),

  team({ id: 'aus-2015', team: 'aus', name: 'Australia', era: '2015', years: [2014, 2015], kind: 'nation', country: 'AUS', comp: 'test', color: '#f2c230', plan: 'blitz' }, `
Israel Folau | FB | 91 | FC | ae=94
Kurtley Beale | FB/FH | 86 | FC
Adam Ashley-Cooper | WG/OC | 87 | WA
Drew Mitchell | WG | 86 | WF
Rob Horne | WG/OC | 83 | WP
Tevita Kuridrani | OC | 86 | 13B
Matt Giteau | IC | 90 | 12P | gk=84
Matt Toomua | IC/FH | 84 | 12P
Bernard Foley | FH | 87 | 10G | gk=86
Quade Cooper | FH | 85 | 10R | gk=80
Will Genia | SH | 91 | 9S
Nick Phipps | SH | 81 | 9S
Scott Sio | LHP | 85 | PS
James Slipper | LHP/THP | 85 | PS
Stephen Moore | HK | 87 | HS
Tatafu Polota-Nau | HK | 85 | HD
Sekope Kepu | THP | 86 | PS
Greg Holmes | THP | 82 | PS
Kane Douglas | LK | 84 | LE
Rob Simmons | LK | 84 | LC
Will Skelton | LK | 84 | LE
Dean Mumm | LK/BF | 82 | LC
Scott Fardy | BF | 86 | F6
Sean McMahon | BF | 84 | FT
Michael Hooper | OF | 91 | FJ
David Pocock | N8/OF | 94 | FJ | bd=97
Wycliff Palu | N8 | 85 | NP
Ben McCalman | N8 | 82 | NP
`),
];
