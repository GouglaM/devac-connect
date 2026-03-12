import React from 'react';
import { Book, Heart, Zap, Shield, Star, Users } from 'lucide-react';
import { EvangelismUnit, Committee } from './types';

export const ADMIN_PASSWORD = 'DEVAC2025';

export const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch (e) {
    // Fallback to manual implementation
  }
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
};

export const BIBLICAL_VERSES = [
  { text: "Car Dieu a tant aimé le monde qu'il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu'il ait la vie éternelle.", reference: "Jean 3:16" },
  { text: "Je puis tout par celui qui me fortifie.", reference: "Philippiens 4:13" },
  { text: "L'Éternel est mon berger: je ne manquerai de rien.", reference: "Psaume 23:1" },
  { text: "Ne crains rien, car je suis avec toi; ne promène pas des regards inquiets, car je suis ton Dieu; je te fortifie, je viens à ton secours, je te soutiens de ma droite triomphante.", reference: "Ésaïe 41:10" },
  { text: "Au commencement, Dieu créa les cieux et la terre.", reference: "Genèse 1:1" },
  { text: "L'Éternel combattra pour vous; et vous, gardez le silence.", reference: "Exode 14:14" },
  { text: "Fortifie-toi et prends courage, car c'est toi qui mettras ce peuple en possession du pays que j'ai juré à leurs pères de leur donner.", reference: "Josué 1:9" },
  { text: "Même quand je marche dans la vallée de l'ombre de la mort, je ne crains aucun mal, car tu es avec moi: ta houlette et ton bâton me rassurent.", reference: "Psaume 23:4" },
  { text: "Confie-toi en l'Éternel de tout ton cœur, et ne t'appuie pas sur ta sagesse.", reference: "Proverbes 3:5" },
  { text: "Car je connais les projets que j'ai formés sur vous, dit l'Éternel, projets de paix et non de malheur, afin de vous donner un avenir et de l'espérance.", reference: "Jérémie 29:11" },
  { text: "Invoque-moi, et je te répondrai; je t'annoncerai de grandes choses, des choses cachées, que tu ne connais pas.", reference: "Jérémie 33:3" },
  { text: "Mais ceux qui se confient en l'Éternel renouvellent leur force. Ils prennent le vol comme les aigles; ils courent, et ne se lassent point, ils marchent, et ne s'épuisent point.", reference: "Ésaïe 40:31" },
  { text: "Cherchez premièrement le royaume et la justice de Dieu; et toutes ces choses vous seront données par-dessus.", reference: "Matthieu 6:33" },
  { text: "Venez à moi, vous tous qui êtes fatigués et chargés, et je vous donnerai du repos.", reference: "Matthieu 11:28" },
  { text: "Tout ce que vous demanderez avec foi par la prière, vous le recevrez.", reference: "Matthieu 21:22" },
  { text: "Jésus lui dit: Je suis le chemin, la vérité, et la vie. Nul ne vient au Père que par moi.", reference: "Jean 14:6" },
  { text: "Nous savons, du reste, que toutes choses concourent au bien de ceux qui aiment Dieu, de ceux qui sont appelés selon son dessein.", reference: "Romains 8:28" },
  { text: "Si tu confesses de ta bouche le Seigneur Jésus, et si tu crois dans ton cœur que Dieu l'a ressuscité des morts, tu seras sauvé.", reference: "Romains 10:9" },
  { text: "Ainsi la foi vient de ce qu'on entend, et ce qu'on entend vient de la parole de Christ.", reference: "Romains 10:17" },
  { text: "Ne vous conformez pas au siècle présent, mais soyez transformés par le renouvellement de l'intelligence.", reference: "Romains 12:2" },
  { text: "L'amour est patient, il est plein de bonté; l'amour n'est pas envieux; l'amour ne se vante pas, il ne s'enfle pas d'orgueil.", reference: "1 Corinthiens 13:4" },
  { text: "Maintenant donc ces trois choses demeurent: la foi, l'espérance, l'amour; mais la plus grande de ces choses, c'est l'amour.", reference: "1 Corinthiens 13:13" },
  { text: "Que tout ce que vous faites se fasse avec amour.", reference: "1 Corinthiens 16:14" },
  { text: "Si quelqu'un est en Christ, il est une nouvelle créature. Les choses anciennes sont passées; voici, toutes choses sont devenues nouvelles.", reference: "2 Corinthiens 5:17" },
  { text: "Ma grâce te suffit, car ma puissance s'accomplit dans la faiblesse.", reference: "2 Corinthiens 12:9" },
  { text: "Mais le fruit de l'Esprit, c'est l'amour, la joie, la paix, la patience, la bonté, la bénignité, la fidélité, la douceur, la tempérance.", reference: "Galates 5:22" },
  { text: "Car c'est par la grâce que vous êtes sauvés, par le moyen de la foi. Et cela ne vient pas de vous, c'est le don de Dieu.", reference: "Éphésiens 2:8" },
  { text: "Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces.", reference: "Philippiens 4:6" },
  { text: "Tout ce que vous faites, faites-le de bon cœur, comme pour le Seigneur et non pour des hommes.", reference: "Colossiens 3:23" },
  { text: "Soyez toujours joyeux. Priez sans cesse. Rendez grâces en toutes choses.", reference: "1 Thessaloniciens 5:16-18" },
  { text: "Car ce n'est pas un esprit de timidité que Dieu nous a donné, mais un esprit de force, d'amour et de sagesse.", reference: "2 Timothée 1:7" },
  { text: "Or la foi est une ferme assurance des choses qu'on espère, une démonstration de celles qu'on ne voit pas.", reference: "Hébreux 11:1" },
  { text: "Soumettez-vous donc à Dieu; résistez au diable, et il fuira loin de vous.", reference: "Jacques 4:7" },
  { text: "Déchargez-vous sur lui de tous vos soucis, car lui-même prend soin de vous.", reference: "1 Pierre 5:7" },
  { text: "Si nous confessons nos péchés, il est fidèle et juste pour nous les pardonner, et pour nous purifier de toute iniquité.", reference: "1 Jean 1:9" },
  { text: "Dieu est amour; et celui qui demeure dans l'amour demeure en Dieu, et Dieu demeure en lui.", reference: "1 Jean 4:16" },
  { text: "Voici, je me tiens à la porte, et je frappe. Si quelqu'un entend ma voix et ouvre la porte, j'entrerai chez lui, je souperai avec lui, et lui avec moi.", reference: "Apocalypse 3:20" },
  { text: "Il essuiera toute larme de leurs yeux, et la mort ne sera plus, et il n'y aura plus ni deuil, ni cri, ni douleur.", reference: "Apocalypse 21:4" },
  { text: "L'Éternel est ma lumière et mon salut: De qui aurais-je crainte?", reference: "Psaume 27:1" },
  { text: "Recommande ton sort à l'Éternel, mets en lui ta confiance, et il agira.", reference: "Psaume 37:5" },
  { text: "Dieu est pour nous un refuge et un appui, un secours qui ne manque jamais dans la détresse.", reference: "Psaume 46:2" },
  { text: "Crée en moi un cœur pur, ô Dieu, renouvelle en moi un esprit bien disposé.", reference: "Psaume 51:12" },
  { text: "Ta parole est une lampe à mes pieds, et une lumière sur mon sentier.", reference: "Psaume 119:105" },
  { text: "Je lève mes yeux vers les montagnes... D'où me viendra le secours? Le secours me vient de l'Éternel, qui a fait les cieux et la terre.", reference: "Psaume 121:1-2" },
  { text: "Ceux qui sèment avec larmes moissonneront avec chants d'allégresse.", reference: "Psaume 126:5" },
  { text: "Je te loue de ce que je suis une créature si merveilleuse. Tes œuvres sont admirables, et mon âme le reconnaît bien.", reference: "Psaume 139:14" },
  { text: "Le nom de l'Éternel est une tour forte; le juste s'y réfugie, et se trouve en sûreté.", reference: "Proverbes 18:10" },
  { text: "Instruis l'enfant selon la voie qu'il doit suivre; et quand il sera vieux, il ne s'en détournera pas.", reference: "Proverbes 22:6" },
  { text: "Un cœur joyeux est un bon remède, mais un esprit abattu dessèche les os.", reference: "Proverbes 17:22" },
  { text: "L'herbe sèche, la fleur tombe; mais la parole de notre Dieu subsiste éternellement.", reference: "Ésaïe 40:8" },
  { text: "Mais il était blessé pour nos péchés, brisé pour nos iniquités; le châtiment qui nous donne la paix est tombé sur lui, et c'est par ses meurtrissures que nous sommes guéris.", reference: "Ésaïe 53:5" },
  { text: "Vous me chercherez, et vous me trouverez, si vous me cherchez de tout votre cœur.", reference: "Jérémie 29:13" },
  { text: "Les bontés de l'Éternel ne sont pas épuisées, ses compassions ne sont pas à leur terme; elles se renouvellent chaque matin. Oh! que ta fidélité est grande!", reference: "Lamentations 3:22-23" },
  { text: "L'Éternel est bon, il est un refuge au jour de la détresse; il connaît ceux qui se confient en lui.", reference: "Nahum 1:7" },
  { text: "Ce n'est ni par la puissance ni par la force, mais c'est par mon esprit, dit l'Éternel des armées.", reference: "Zacharie 4:6" },
  { text: "Heureux ceux qui ont le cœur pur, car ils verront Dieu!", reference: "Matthieu 5:8" },
  { text: "Vous êtes la lumière du monde. Une ville située sur une montagne ne peut être cachée.", reference: "Matthieu 5:14" },
  { text: "Ne vous inquiétez donc pas du lendemain; car le lendemain aura soin de lui-même. A chaque jour suffit sa peine.", reference: "Matthieu 6:34" },
  { text: "Demandez, et l'on vous donnera; cherchez, et vous trouverez; frappez, et l'on vous ouvrira.", reference: "Matthieu 7:7" },
  { text: "Tout ce que vous voulez que les hommes fassent pour vous, faites-le de même pour eux.", reference: "Matthieu 7:12" },
  { text: "Allez, faites de toutes les nations des disciples, les baptisant au nom du Père, du Fils et du Saint-Esprit.", reference: "Matthieu 28:19" },
  { text: "Tout est possible à celui qui croit.", reference: "Marc 9:23" },
  { text: "Car rien n'est impossible à Dieu.", reference: "Luc 1:37" },
  { text: "Le voleur ne vient que pour dérober, égorger et détruire; moi, je suis venu afin que les brebis aient la vie, et qu'elles soient dans l'abondance.", reference: "Jean 10:10" },
  { text: "Je suis la résurrection et la vie. Celui qui croit en moi vivra, quand même il serait mort.", reference: "Jean 11:25" },
  { text: "Si vous avez de l'amour les uns pour les autres, tous connaîtront que vous êtes mes disciples.", reference: "Jean 13:35" },
  { text: "Je vous laisse la paix, je vous donne ma paix. Je ne vous donne pas comme le monde donne. Que votre cœur ne se trouble point, et ne s'alarme point.", reference: "Jean 14:27" },
  { text: "Je suis le cep, vous êtes les sarments. Celui qui demeure en moi et en qui je demeure porte beaucoup de fruit, car sans moi vous ne pouvez rien faire.", reference: "Jean 15:5" },
  { text: "Il n'y a pas de plus grand amour que de donner sa vie pour ses amis.", reference: "Jean 15:13" },
  { text: "Sanctifie-les par ta vérité: ta parole est la vérité.", reference: "Jean 17:17" },
  { text: "Mais vous recevrez une puissance, le Saint-Esprit survenant sur vous, et vous serez mes témoins.", reference: "Actes 1:8" },
  { text: "Il n'y a de salut en aucun autre; car il n'y a sous le ciel aucun autre nom qui ait été donné parmi les hommes, par lequel nous devions être sauvés.", reference: "Actes 4:12" },
  { text: "Il faut obéir à Dieu plutôt qu'aux hommes.", reference: "Actes 5:29" },
  { text: "Crois au Seigneur Jésus, et tu seras sauvé, toi et ta famille.", reference: "Actes 16:31" },
  { text: "Car je n'ai point honte de l'Évangile: c'est une puissance de Dieu pour le salut de quiconque croit.", reference: "Romains 1:16" },
  { text: "Mais Dieu prouve son amour envers nous, en ce que, lorsque nous étions encore des pécheurs, Christ est mort pour nous.", reference: "Romains 5:8" },
  { text: "Car le salaire du péché, c'est la mort; mais le don gratuit de Dieu, c'est la vie éternelle en Jésus-Christ notre Seigneur.", reference: "Romains 6:23" },
  { text: "Il n'y a donc maintenant aucune condamnation pour ceux qui sont en Jésus-Christ.", reference: "Romains 8:1" },
  { text: "Si Dieu est pour nous, qui sera contre nous?", reference: "Romains 8:31" },
  { text: "Qui nous séparera de l'amour de Christ? Sera-ce la tribulation, ou l'angoisse, ou la persécution, ou la faim, ou la nudité, ou le péril, ou l'épée?", reference: "Romains 8:35" },
  { text: "Soyez fervents d'esprit. Servez le Seigneur. Réjouissez-vous en espérance. Soyez patients dans l'affliction. Persévérez dans la prière.", reference: "Romains 12:11-12" },
  { text: "Ne te laisse pas vaincre par le mal, mais surmonte le mal par le bien.", reference: "Romains 12:21" },
  { text: "La nuit est avancée, le jour approche. Dépouillons-nous donc des œuvres des ténèbres, et revêtons les armes de la lumière.", reference: "Romains 13:12" },
  { text: "Car le royaume de Dieu, ce n'est pas le manger et le boire, mais la justice, la paix et la joie, par le Saint-Esprit.", reference: "Romains 14:17" },
  { text: "Que le Dieu de l'espérance vous remplisse de toute joie et de toute paix dans la foi.", reference: "Romains 15:13" },
  { text: "Ne savez-vous pas que votre corps est le temple du Saint-Esprit qui est en vous?", reference: "1 Corinthiens 6:19" },
  { text: "Dieu est fidèle, et il ne permettra pas que vous soyez tentés au-delà de vos forces.", reference: "1 Corinthiens 10:13" },
  { text: "Ainsi donc, que vous mangiez, que vous buviez, quoi que vous fassiez, faites tout pour la gloire de Dieu.", reference: "1 Corinthiens 10:31" },
  { text: "Car nous marchons par la foi et non par la vue.", reference: "2 Corinthiens 5:7" },
  { text: "C'est pour la liberté que Christ nous a affranchis. Demeurez donc fermes.", reference: "Galates 5:1" },
  { text: "Portez les fardeaux les uns des autres, et vous accomplirez ainsi la loi de Christ.", reference: "Galates 6:2" },
  { text: "Ne nous lassons pas de faire le bien; car nous moissonnerons au temps convenable, si nous ne nous relâchons pas.", reference: "Galates 6:9" },
  { text: "Car nous sommes son ouvrage, ayant été créés en Jésus-Christ pour de bonnes œuvres.", reference: "Éphésiens 2:10" },
  { text: "Rachetez le temps, car les jours sont mauvais.", reference: "Éphésiens 5:16" },
  { text: "Revêtez-vous de toutes les armes de Dieu, afin de pouvoir tenir ferme contre les ruses du diable.", reference: "Éphésiens 6:11" },
  { text: "Je prie que ton amour augmente de plus en plus en connaissance et en pleine intelligence.", reference: "Philippiens 1:9" },
  { text: "Réjouissez-vous toujours dans le Seigneur; je le répète, réjouissez-vous.", reference: "Philippiens 4:4" },
  { text: "Et mon Dieu pourvoira à tous vos besoins selon sa richesse, avec gloire, en Jésus-Christ.", reference: "Philippiens 4:19" },
  { text: "Si donc vous êtes ressuscités avec Christ, cherchez les choses d'en haut, où Christ est assis à la droite de Dieu.", reference: "Colossiens 3:1" },
  { text: "La joie de l'Éternel sera votre force.", reference: "Néhémie 8:10" }
];


export const PRAYER_TOPICS = [
  { topic: "Paix dans les familles", details: "Prions pour l'harmonie et la restauration des foyers en difficulté." },
  { topic: "Croissance Spirituelle", details: "Que chaque membre puisse approfondir sa relation personnelle avec Christ." },
  { topic: "Mission d'Évangélisation", details: "Prions pour l'ouverture des cœurs dans notre communauté locale." }
];

export const INITIAL_UNITS: EvangelismUnit[] = [
  {
    id: 'u1',
    name: 'Unité Élie',
    mission: 'Évangélisation et intercession',
    members: [
      { id: 'm1', name: 'GOUGLA MARCELLIN', phone: '0709938391', location: 'COCODY ATTOBAN' },
      { id: 'm2', name: 'BONGO RAYMOND', phone: '0708110229', location: 'COCODY RIVIERA 2' },
      { id: 'm3', name: 'Mme EDI CLEMENTINE', phone: '0707674037', location: 'COCODY CITE DES ARTS' },
      { id: 'm4', name: 'EDI YEPIE FAUSTIN', phone: '0707094480', location: 'COCODY CITE DES ARTS' },
      { id: 'm5', name: 'BECHIE JOEL THIERRY', phone: '0707524295', location: 'COCODY ABATTA' },
      { id: 'm6', name: 'Mme BECHIE RAÏSSA', phone: '0707808716', location: 'COCODY ABATTA' },
      { id: 'm7', name: 'OULOU MARIE-MICHELLE', phone: '0767438578', location: 'COCODY BLAUCKOSS' },
      { id: 'm8', name: 'BOGUI BLANDINE', phone: '0708178110', location: 'COCODY' },
      { id: 'm9', name: 'TAH BI TCHAN MICHAEL', phone: '0768665747', location: 'COCODY' },
      { id: 'm10', name: 'Mme TOURE MARIE-LAURE', phone: '0749028171', location: 'COCODY' },
      { id: 'm11', name: 'Mme KRA ANGE JOËLLE', phone: '0789014552', location: 'COCODY' },
      { id: 'm12', name: 'Mme DAGO LEA', phone: '0749958853', location: 'COCODY' },
      { id: 'm13', name: 'Mme TCHIMOU BEATRICE', phone: '0747748507', location: 'BINGERVILLE' },
      { id: 'm14', name: 'GNAGO FEDINE', phone: '0503379912', location: 'COCODY ABATTA' },
      { id: 'm15', name: 'YAPI Asseu Florent', phone: '0708939144', location: 'ADZOPE' },
      { id: 'm16', name: 'SANOUSSI MOUSSA', phone: '0707397707', location: 'COCODY ANONON' },
      { id: 'm17', name: 'YAO Kouassi Alain', phone: '0787894351', location: '' },
      { id: 'm18', name: 'KOUAME Jean Yves', phone: '0748325587', location: 'COCODY' },
      { id: 'm19', name: 'KOUAME Marthe', phone: '0767854584', location: 'YAMOUSSOUKRO' }
    ],
    leaderName: "Mme EDI Clémentine",
    assistantName: "BONGO Raymond",
    office: [
      { id: 'o1', position: '1- Responsable', name: 'Mme EDI CLEMENTINE' },
      { id: 'o2', position: '2- Responsable Adjt', name: 'BONGO RAYMOND' },
      { id: 'o3', position: '3- Secrétaire Général', name: 'GOUGLA MARCELLIN' },
      { id: 'o4', position: '4- Secrétaire Général adjt', name: 'KOUAME Marthe' },
      { id: 'o5', position: '5- Trésorière Générale', name: 'Mme TCHIMOU BEATRICE' },
      { id: 'o6', position: '6- Trésorière Générale Adjt', name: 'Mme KRA ANGE JOËLLE' },
      { id: 'o7', position: '7- Commissaire aux comptes', name: 'SANOUSSI MOUSSA' },
      { id: 'o8', position: '8- Secrétaire à la prière', name: 'BOGUI BLANDINE' },
      { id: 'o9', position: '9- Secrétaire à la prière Adjt', name: 'TAH BI TCHAN MICHAEL' },
      { id: 'o10', position: '10- Secrétaire à l\'encadrement des âmes', name: 'EDI YEPIE FAUSTIN' },
      { id: 'o11', position: '11- Secrétaire à l\'encadrement des âmes Adjt', name: 'Mme TOURE MARIE-LAURE' }
    ]
  },
  {
    id: 'u2',
    name: 'Unité Pierre',
    mission: 'Fondation et enseignement spirituel',
    members: [
      { id: 'p1', name: 'Mme AMAN CORINE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p2', name: 'DJAZE SARAH', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p3', name: 'VAO STEPHANE', profession: 'MEMBRE', location: 'COCODY' },

      { id: 'p5', name: 'BAHON HERMANN', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p6', name: 'KAMONOU ODETTE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p7', name: 'GNAGNO GILLES ANDRE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p8', name: 'Mme GNEFRE AMINATA', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p10', name: 'KOUAME ASSENAH SOLANGE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p11', name: 'GOPOU RITA', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p13', name: "N'GUESSAN KONAN HENRI-JOËL", profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p14', name: 'Mme SIDIO IRÈNE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p15', name: 'GNAMIEN JEROME', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'pa6', name: 'KOUAKOU NAOMIE', profession: 'MEMBRE', location: 'COCODY' }
    ],
    leaderName: "Mme SIDIO Irène",
    assistantName: "",
    office: [
      { id: 'o2-1', position: 'Responsable', name: 'Mme SIDIO Irène' }
    ]
  },
  {
    id: 'u3',
    name: 'Unité Paul',
    mission: 'Mission d\'expansion et implantation',
    members: [
      { id: 'pa1', name: 'Mme ANO SYLVIE-ANNE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'pa2', name: 'Mme GBOGBOHOUNDADA MARTHE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'pa3', name: 'Mme AKA LOUISE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'pa4', name: 'YAHIRI ZAMBLE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'pa5', name: 'KACOU MAUH ANNIE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'pa7', name: 'OUENAN GNONKA PASCAL', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'pa8', name: 'GBOGBOHOUNDADA MARC', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'pa9', name: 'BONNE LETO NARCISSE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'pa10', name: "N'GORAN KOUAKOU CHARLES", profession: 'RESPONSABLE', location: 'COCODY' },
      { id: 'p9', name: 'Mme KONAN PASCALINE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p16', name: 'LIDA ARMAND', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'p17', name: 'LOKOSSOU JONATHAN', profession: 'MEMBRE', phone: '0143369055', location: 'COCODY' },
      { id: 'pa11', name: "N'GUESSAN OTHNIEL", profession: 'MEMBRE', location: 'COCODY' },
      { id: 'pa12', name: "Mme YAO JOËLLE", profession: 'MEMBRE', location: 'COCODY' },
      { id: 'oe1', name: 'OUREGA ETIENNE', profession: 'MEMBRE', location: 'COCODY' }
    ],
    leaderName: "N'GORAN KOUAKOU Charles",
    assistantName: "Mme YAO JOËLLE",
    office: [
      { id: 'o3-1', position: 'Responsable', name: "N'GORAN KOUAKOU Charles" },
      { id: 'o3-2', position: 'Responsable Adjt', name: "Mme YAO JOËLLE" }
    ]
  },
  {
    id: 'u4',
    name: 'Unité Emmanuel',
    mission: 'Présence, foi et accompagnement',
    members: [
      { id: 'e1', name: 'BAHIE HERMAS', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'e2', name: 'KPANDE MAGUI SERGE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'e3', name: 'ABO APPOLINAIRE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'e4', name: 'KOUAME WAKA HERMINE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'e5', name: 'GNALLA EDEN EUNICE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'e6', name: 'KOFFI JEROME', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'e7', name: 'TAPE EMILIE SARAH', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'e8', name: 'ATSE BAH AMEDE', profession: 'RESPONSABLE', location: 'COCODY' }
    ],
    leaderName: "ATSE BAH AMEDE",
    assistantName: "N'GUESSAN KONAN HENRI-JOËL",
    office: [
      { id: 'o4-1', position: 'Responsable', name: "ATSE BAH AMEDE" },
      { id: 'o4-2', position: 'Responsable Adjt', name: "N'GUESSAN KONAN HENRI-JOËL" }
    ]
  },
  {
    id: 'u5',
    name: 'Unité Onésime',
    mission: 'Réconciliation, service et amour fraternel',
    members: [
      { id: 'on1', name: 'GRODJI KOUAME FELIX', profession: 'RESPONSABLE', location: 'COCODY' },
      { id: 'on2', name: 'IRIE TRA BI MICHEL', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'on3', name: 'GNEBASSE Nadège', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'ds1', name: 'Mme DJON STÉPHANIE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'on4', name: 'KONE TENIN REBECCA', profession: 'MEMBRE', location: 'COCODY' }
    ],
    leaderName: "GRODJI KOUAME FELIX",
    assistantName: "KONE TENIN REBECCA",
    office: [
      { id: 'o5-1', position: 'Responsable', name: "GRODJI KOUAME FELIX" },
      { id: 'o5-2', position: 'Responsable Adjt', name: "KONE TENIN REBECCA" }
    ]
  },
  {
    id: 'u6',
    name: 'Unité ELISHAMA',
    mission: 'Écoute, sagesse et repos divin',
    members: [
      { id: 'el1', name: "N'GUESSAN N'DRI LEWIS MICHAEL", profession: 'MEMBRE', location: 'COCODY' },
      { id: 'el2', name: 'DJEDJE JAELLE', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'el3', name: 'KOUAME WAKA DONATIEN', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'el4', name: 'Mme TIAHOU SARA', profession: 'MEMBRE', location: 'COCODY' },
      { id: 'el5', name: 'ASSIE PIERRE', profession: 'RESPONSABLE', location: 'COCODY' }
    ],
    leaderName: "ASSIE PIERRE",
    assistantName: "N'GUESSAN N'DRI LEWIS MICHAËL",
    office: [
      { id: 'o6-1', position: 'Responsable', name: "ASSIE PIERRE" },
      { id: 'o6-2', position: 'Responsable Adjt', name: "N'GUESSAN N'DRI LEWIS MICHAËL" }
    ]
  }
];

export const INITIAL_COMMITTEES: Committee[] = [
  { id: 'c1', name: 'Comité Technique', description: 'Gestion de la sono, du streaming et des équipements techniques.', members: [] },
  { id: 'c2', name: 'Comité Logistique', description: 'Organisation matérielle et gestion des infrastructures des événements.', members: [] },
  { id: 'c3', name: 'Comité Artistique', description: 'Coordination de la musique, de la chorale et des arts visuels.', members: [] },
  { id: 'c4', name: 'Comité Littérature', description: 'Rédaction de contenus, publications et gestion de la documentation.', members: [] },
  { id: 'c5', name: 'Comité Action Sociale', description: 'Soutien aux nécessiteux, visites et projets caritatifs.', members: [] }
];

export const TAFIRE_SITES = [
  // 10 Quartiers
  { id: 'q1', name: 'Kanakaha', type: 'QUARTIER' },
  { id: 'q2', name: 'Diogaha', type: 'QUARTIER' },
  { id: 'q3', name: 'Napié', type: 'QUARTIER' },
  { id: 'q4', name: 'Kafiné', type: 'QUARTIER' },
  { id: 'q5', name: 'Selikala', type: 'QUARTIER' },
  { id: 'q6', name: 'Bougou', type: 'QUARTIER' },
  { id: 'q7', name: 'Soba', type: 'QUARTIER' },
  { id: 'q8', name: 'Dioulabougou', type: 'QUARTIER' },
  { id: 'q9', name: 'Bromakoté', type: 'QUARTIER' },
  { id: 'q10', name: 'Longonzo', type: 'QUARTIER' },
  // 9 Villages
  { id: 'v1', name: 'N’GOLODOUGOU', type: 'VILLAGE' },
  { id: 'v2', name: 'KONIBATOGO', type: 'VILLAGE' },
  { id: 'v3', name: 'SEPIKAHA', type: 'VILLAGE' },
  { id: 'v4', name: 'KOULOKAHA', type: 'VILLAGE' },
  { id: 'v5', name: 'KOLOKAHA', type: 'VILLAGE' },
  { id: 'v6', name: 'NAMBANAKAHA', type: 'VILLAGE' },
  { id: 'v7', name: 'SELILEKAHA', type: 'VILLAGE' },
  { id: 'v8', name: 'TIELETANANKAHA', type: 'VILLAGE' },
  { id: 'v9', name: 'NIEDIEKAHA', type: 'VILLAGE' }
];
export const CAMPAIGN_ACTIVITIES = [
  { id: 'act1', name: 'Projections de films', icon: 'ImageIcon' },
  { id: 'act2', name: 'Porte-à-porte', icon: 'Users' },
  { id: 'act3', name: 'Plein-air', icon: 'Zap' },
  { id: 'act4', name: 'Concert d’évangélisation, Adoration et Louange', icon: 'Star' },
  { id: 'act5', name: 'Prestations de la Troupe Artistique', icon: 'Award' },
  { id: 'act6', name: 'Consultations médicales', icon: 'Heart' },
  { id: 'act7', name: 'Activités sportives', icon: 'Target' },
  { id: 'act8', name: 'Actions sociales (Dons vivres et non vivres)', icon: 'Gift' }
];

export const PREP_ACTIVITIES = [
  { id: 'prep1', name: 'Temps de prières (Tous les missionnaires)', icon: 'Users' },
  { id: 'prep2', name: 'Chaîne de jeûnes et prières', icon: 'Timer' },
  { id: 'prep3', name: 'Veillées de prière', icon: 'Zap' },
  { id: 'prep4', name: 'Formations à l’Évangélisation', icon: 'BookOpen' },
  { id: 'prep5', name: 'Formations à l’Encadrement', icon: 'Users' },
  { id: 'prep6', name: 'Réunions du Comité (Présentiel / Ligne)', icon: 'ShieldCheck' }
];

export const MISSIONARY_CATEGORIES = [
  'Membres du Conseil des AD Cocody',
  'Membres du Département d’Evangélisation (DEVAC)',
  'Membres du Département d’Adoration et de Louange (DAL)',
  'La Troupe artistique',
  'Membres de l’ONG EEVA / Département Enfants',
  'Membres du Département d’Encadrement',
  'Membres du Département de Santé et GBH',
  'Membres du Département de Prière et de Délivrance',
  'Membres des autres Départements (AOC, JADCO, ...)'
];
