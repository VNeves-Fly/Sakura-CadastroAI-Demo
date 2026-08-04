import type { PrismaClient } from "@prisma/client";

// Fonte real: planilha "Links Promotores.xlsx" (aba Promotores),
// enviada pelo usuário em 2026-07-24 — substitui o mock de nomes
// abreviados/apelidos que o módulo de Atribuições usava até então.
// SICA 26 aparece só uma vez aqui porque, na planilha original, tanto
// SANDRO MAROTA quanto GILBERTO GRUDKA usam o mesmo código — confirmado
// pelo usuário que são sócios e compartilham o SICA de propósito, não é
// erro de digitação (por isso os dois nomes/e-mails/telefones/links
// aparecem combinados numa linha só, em vez de inventar um SICA novo
// pra um dos dois).
//
// `bases` vem de uma segunda fonte real, o export "gerentes_conta" /
// "gerentes_conta_bases" de um sistema anterior (2026-07-27) — cruzado
// aqui por e-mail. Só cobre 11 das pessoas abaixo (o export em si é bem
// menor que esta lista); as demais ficam sem base até existir fonte real
// pra elas também. `sica`/`link` ficam `null` pras 5 pessoas que só
// existem nesse export (Marcel Mazzonetto, Tainara Dini, Grasiele
// Carara, Luis Vargas, Cecília Uda — ela aparecia só como o apelido
// "SEKAI" no campo `gestor` de PC-Paulo Cesar até então): esse export
// não tem SICA nem link pessoal de cadastro, e nenhum dos dois pode ser
// inventado.
const PROMOTORES: Array<{
  sica: number | null;
  nome: string;
  gestor: string;
  email: string;
  telefone: string | null;
  link: string | null;
  bases?: string[];
}> = [
  {
    sica: 65,
    nome: "ALEXANDRE SIMOES",
    gestor: "VICTOR OLIVEIRA",
    email: "alexandre.simoes@sakuratur.com.br",
    telefone: "31 99630-3526",
    link: "https://flysakura.com/cadastro?evento=site&executivo=0e1b22d7-44f9-40bc-8a9d-1db3a3570bbc",
  },
  {
    sica: 98,
    nome: "AMANDA SIMOES",
    gestor: "VICTOR OLIVEIRA",
    email: "amanda.simoes@sakuratur.com.br",
    telefone: "21 99630-0181",
    link: "https://flysakura.com/cadastro?evento=site&executivo=87d04d0e-57be-4350-9bb4-eb7b59fdbf79",
  },
  {
    sica: 31,
    nome: "BRUNO LYRA",
    gestor: "DOUGLAS MENDES",
    email: "bruno.lyra@sakuratur.com.br",
    telefone: "82 98789-1112",
    link: "https://flysakura.com/cadastro?evento=site&executivo=39d3d789-7b0f-42af-bae1-1082c5c5963a",
  },
  {
    sica: 28,
    nome: "CAMILA PITON",
    gestor: "CAMILA PITON",
    email: "camila.piton@sakuratur.com.br",
    telefone: "19 99328-6161",
    link: "https://flysakura.com/cadastro?evento=site&executivo=4466d4fa-4ff1-4f87-94d6-dcbb475479bd",
    bases: ["CPQ"],
  },
  {
    sica: null,
    nome: "CECILIA UDA",
    gestor: "CECILIA UDA",
    email: "cecilia.uda@sakuratur.com.br",
    telefone: "48 99982-4588",
    link: null,
    bases: ["FLN"],
  },
  {
    sica: 105,
    nome: "CAMILA SALGADO",
    gestor: "PEDRO CICCARELLI",
    email: "camila.salgado@sakuratur.com.br",
    telefone: "67 98134-6749",
    link: "https://flysakura.com/cadastro?evento=site&executivo=990816ec-d402-43bf-852e-d20dce0dcc79",
  },
  {
    sica: 108,
    nome: "CARLOS ALMADA",
    gestor: "KARLA SANTOS",
    email: "carlos.almada@sakuratur.com.br",
    telefone: "85 99649-8047",
    link: "https://flysakura.com/cadastro?evento=site&executivo=97f75cd1-46ac-4dcd-a212-57586bdf8ab9",
  },
  {
    sica: 82,
    nome: "CONECTA",
    gestor: "GRASIELE CARARA",
    email: "conecta@sakuratur.com.br",
    telefone: "11 96793-5857",
    link: "https://flysakura.com/cadastro?evento=site&executivo=3bd2a16c-ce13-4c53-acbe-841fcb75ac59",
  },
  {
    sica: 113,
    nome: "DANIELLE SOARES",
    gestor: "KARLA SANTOS",
    email: "danielle.soares@sakuratur.com.br",
    telefone: "83 99931-3020",
    link: "https://flysakura.com/cadastro?evento=site&executivo=41338b4e-9e75-4870-a9e4-603cd1d64a9d",
  },
  {
    sica: 93,
    nome: "DANIELLI OLIVEIRA",
    gestor: "FERNANDO BLANCO",
    email: "danielli.oliveira@sakuratur.com.br",
    telefone: "51 99668-4728",
    link: "https://flysakura.com/cadastro?evento=site&executivo=b260599c-9433-4e95-9698-210e7ea4f6eb",
  },
  {
    sica: 41,
    nome: "DHEBORA ROLA",
    gestor: "DOUGLAS MENDES",
    email: "dhebora.rola@sakuratur.com.br",
    telefone: "85 99616-3897",
    link: "https://flysakura.com/cadastro?evento=site&executivo=f357d861-23d7-4ad0-b0ca-20933128106d",
  },
  {
    sica: 76,
    nome: "DOMINGOS SANTANA",
    gestor: "DOUGLAS MENDES",
    email: "domingos.santana@sakuratur.com.br",
    telefone: "81 98103-1566",
    link: "https://flysakura.com/cadastro?evento=site&executivo=74074671-3eeb-465b-bac4-fc4433d7b7cb",
  },
  {
    sica: 15,
    nome: "DOUGLAS MENDES",
    gestor: "DOUGLAS MENDES",
    email: "douglas.mendes@sakuratur.com.br",
    telefone: "11 99977-9076",
    link: "https://flysakura.com/cadastro?evento=site&executivo=acef7463-429f-47e3-87fe-4fb191b2b23e",
    bases: [
      "SAO",
      "FOR",
      "MAO",
      "RAO",
      "RBR",
      "NAT",
      "SSZ",
      "BVB",
      "MCZ",
      "MCP",
      "AJU",
      "BEL",
      "REC",
      "THE",
      "JPA",
      "PVH",
    ],
  },
  {
    sica: 49,
    nome: "EDILSON GEGE",
    gestor: "MARCEL MAZZONETTO",
    email: "edilson.gege@sakuratur.com.br",
    telefone: "12 98843-7309",
    link: "https://flysakura.com/cadastro?evento=site&executivo=9ba2f5de-6f78-4aec-bbf6-34e6985bc778",
  },
  {
    sica: 111,
    nome: "EDUARDA PEREIRA",
    gestor: "KARLA SANTOS",
    email: "eduarda.pereira@sakuratur.com.br",
    telefone: "83 98708-7137",
    link: "https://flysakura.com/cadastro?evento=site&executivo=85144054-83cd-4681-80e5-5f8c11c6cce5",
  },
  {
    sica: 125,
    nome: "EDUARDO SULMONETTI",
    gestor: "RODRIGO GRANGHELLI",
    email: "eduardo.sulmonetti@sakuratur.com.br",
    telefone: null,
    link: "https://flysakura.com/cadastro?evento=site&executivo=63764611-88ee-4956-b8ac-fdf6798c5d0f",
  },
  {
    sica: 13,
    nome: "ELCIO VIEIRA",
    gestor: "ELCIO VIEIRA",
    email: "elcio.vieira@sakuratur.com.br",
    telefone: "61 98530-9992",
    link: "https://flysakura.com/cadastro?evento=site&executivo=509af8a7-73fe-4838-9367-923168fe2c15",
    bases: ["CGB", "CGR", "GYN", "PMW", "BSB"],
  },
  {
    sica: 54,
    nome: "FABIANA ANDRADE",
    gestor: "MIGUEL RAMOS",
    email: "fabiana.andrade@sakuratur.com.br",
    telefone: "11 97386-5069",
    link: "https://flysakura.com/cadastro?evento=site&executivo=72ca0c92-6d25-4964-963f-1074b854adb1",
  },
  {
    sica: 91,
    nome: "FERNANDA CASSAB",
    gestor: "JOSINEI MOREIRA",
    email: "fernanda.cassab@sakuratur.com.br",
    telefone: "41 98418-0058",
    link: "https://flysakura.com/cadastro?evento=site&executivo=536f3a18-4e43-4788-90c2-7d4e9107bea4",
  },
  {
    sica: 110,
    nome: "FERNANDA MENDONCA",
    gestor: "KARLA SANTOS",
    email: "fernanda.mendonca@sakuratur.com.br",
    telefone: "71 99196-1510",
    link: "https://flysakura.com/cadastro?evento=site&executivo=ab922769-ad2d-4569-a5ea-38f6db00d898",
  },
  {
    sica: 16,
    nome: "FERNANDO BLANCO",
    gestor: "FERNANDO BLANCO",
    email: "fernando.blanco@sakuratur.com.br",
    telefone: "51 99946-2244",
    link: "https://flysakura.com/cadastro?evento=site&executivo=716120d3-f875-409e-8503-e40c3c06dcdc",
    bases: ["POA"],
  },
  {
    sica: 127,
    nome: "FERNANDO LERMI",
    gestor: "FERNANDO LERMI",
    email: "fernando.lermi@sakuratur.com.br",
    telefone: "11 91291-8585",
    link: "https://flysakura.com/cadastro?evento=site&executivo=e1186c9a-535f-4fdb-b3c5-39c37481acc5",
  },
  {
    sica: 101,
    nome: "FILIPE RODRIGUES",
    gestor: "PEDRO CICCARELLI",
    email: "filipe.rodrigues@sakuratur.com.br",
    telefone: "61 99158-6674",
    link: "https://flysakura.com/cadastro?evento=site&executivo=342c0676-c238-4bb0-a665-5d627e5d4f15",
  },
  {
    sica: 68,
    nome: "FLAVIA PAMPONET",
    gestor: "MIGUEL RAMOS",
    email: "flavia.pamponet@sakuratur.com.br",
    telefone: "11 96085-7675",
    link: "https://flysakura.com/cadastro?evento=site&executivo=20bfa4f0-8696-4b7e-a700-d192356b44c9",
  },
  {
    sica: 119,
    nome: "FLAVIANO RODRIGUES",
    gestor: "VICTOR OLIVEIRA",
    email: "flaviano.rodrigues@sakuratur.com.br",
    telefone: "34 99682-2955",
    link: "https://flysakura.com/cadastro?evento=site&executivo=6f51b324-7e08-40b5-97fb-7e976c03fb92",
  },
  {
    sica: 116,
    nome: "FRANKLIN PEIXOTO",
    gestor: "AMANDA SIMOES",
    email: "franklin.peixoto@sakuratur.com.br",
    telefone: "21 98354-4543",
    link: "https://flysakura.com/cadastro?evento=site&executivo=f12b69fc-78d8-4000-80f9-2d58a0d994b2",
  },
  {
    sica: 38,
    nome: "GILCIMAR FREITAS",
    gestor: "THAIS BARRETO",
    email: "gilcimar.freitas@sakuratur.com.br",
    telefone: "71 99227-3664",
    link: "https://flysakura.com/cadastro?evento=site&executivo=d042b82a-67c2-4b26-b4fb-6379965cf2ba",
  },
  {
    sica: 102,
    nome: "GISELLY MOURA",
    gestor: "PEDRO CICCARELLI",
    email: "giselly.moura@sakuratur.com.br",
    telefone: "62 98150-0301",
    link: "https://flysakura.com/cadastro?evento=site&executivo=9afe2cf0-e99a-45fb-b2de-161d6fec1461",
  },
  {
    sica: null,
    nome: "GRASIELE CARARA",
    gestor: "GRASIELE CARARA",
    email: "grasiele.carara@sakuratur.com.br",
    telefone: "11 96793-5857",
    link: null,
  },
  {
    sica: 120,
    nome: "GRAZIELA DIAS",
    gestor: "VICTOR OLIVEIRA",
    email: "graziela.dias@sakuratur.com.br",
    telefone: "32 98859-2644",
    link: "https://flysakura.com/cadastro?evento=site&executivo=6af024bf-63a2-4489-a4bd-9f661b0ab221",
  },
  {
    sica: 109,
    nome: "HENRIQUE SOUSA",
    gestor: "KARLA SANTOS",
    email: "henrique.sousa@sakuratur.com.br",
    telefone: "85 99984-6374",
    link: "https://flysakura.com/cadastro?evento=site&executivo=b77f5db1-cbd5-44af-8319-d41fd6e57a5e",
  },
  {
    sica: 87,
    nome: "IRLANA NASCIMENTO",
    gestor: "DOUGLAS MENDES",
    email: "irlana.nascimento@sakuratur.com.br",
    telefone: "69 98111-2474",
    link: "https://flysakura.com/cadastro?evento=site&executivo=f6f9dca1-f517-4704-acad-0ca8bde7c5fa",
  },
  {
    sica: 7,
    nome: "IVAIR PEREIRA",
    gestor: "IVAIR PEREIRA",
    email: "ivair.pereira@sakuratur.com.br",
    telefone: "31 99662-2511",
    link: "https://flysakura.com/cadastro?evento=site&executivo=9bdbd408-ab7e-48ae-a583-7984463522e1",
  },
  {
    sica: 19,
    nome: "IVANIO MONTEIRO",
    gestor: "DOUGLAS MENDES",
    email: "ivanio.monteiro@sakuratur.com.br",
    telefone: "95 99972-1100",
    link: "https://flysakura.com/cadastro?evento=site&executivo=6d5c366e-386d-4f45-b715-5f05329043f1",
  },
  {
    sica: 129,
    nome: "JESSE GUIMARAES",
    gestor: "DOUGLAS MENDES",
    email: "jesse.guimaraes@sakuratur.com.br",
    telefone: null,
    link: "https://flysakura.com/cadastro?evento=site&executivo=dbeb713b-492c-41ec-a3e2-b60ceb296386",
  },
  {
    sica: 32,
    nome: "JONATHAS MENDRONI",
    gestor: "MIGUEL RAMOS",
    email: "jonathas.mendroni@sakuratur.com.br",
    telefone: "11 99664-4962",
    link: "https://flysakura.com/cadastro?evento=site&executivo=72ef60ba-fcbc-42ee-a889-f7b0b829e65f",
  },
  {
    sica: 8,
    nome: "JORGE BORGES",
    gestor: "JORGE BORGES",
    email: "jorge.borges@sakuratur.com.br",
    telefone: "45 99105-0334",
    link: "https://flysakura.com/cadastro?evento=site&executivo=6a0933d3-35d2-42f9-9a89-9e4ccca30766",
    bases: ["IGU"],
  },
  {
    sica: 99,
    nome: "JORGE MARINS",
    gestor: "JORGE MARINS",
    email: "jorge.marins@sakuratur.com.br",
    telefone: "61 99362-6226",
    link: "https://flysakura.com/cadastro?evento=site&executivo=daebceeb-6550-4457-bc92-bdbd2fcfc0c2",
  },
  {
    sica: 126,
    nome: "JOSINEI MOREIRA",
    gestor: "JOSINEI MOREIRA",
    email: "josinei.moreira@sakuratur.com.br",
    telefone: "41 99600-8389",
    link: "https://flysakura.com/cadastro?evento=site&executivo=eb4ecea6-ebef-4646-8848-1862a59e2a82",
  },
  {
    sica: 114,
    nome: "JOYCE KIEV",
    gestor: "KARLA SANTOS",
    email: "joyce.kiev@sakuratur.com.br",
    telefone: "83 99970-5638",
    link: "https://flysakura.com/cadastro?evento=site&executivo=74634485-c440-4483-b1fd-ad48dff08a4f",
  },
  {
    sica: 117,
    nome: "JULIANA MORENO",
    gestor: "AMANDA SIMOES",
    email: "juliana.moreno@sakuratur.com.br",
    telefone: "21 99631-9210",
    link: "https://flysakura.com/cadastro?evento=site&executivo=a979387e-8c52-49f6-90fe-ff1f9ab41f5c",
  },
  {
    sica: 55,
    nome: "JUNIOR PEREZ",
    gestor: "MARCEL MAZZONETTO",
    email: "junior.perez@sakuratur.com.br",
    telefone: "18 99656 7030",
    link: "https://flysakura.com/cadastro?evento=site&executivo=bcaa6ed4-e67c-427a-8430-d1b628c5cc2b",
  },
  {
    sica: 106,
    nome: "KARLA SANTOS",
    gestor: "KARLA SANTOS",
    email: "karla.santos@sakuratur.com.br",
    telefone: "81 99732-7717",
    link: "https://flysakura.com/cadastro?evento=site&executivo=0f806eb5-f461-4fe6-b59e-712ae3ed99dc",
  },
  {
    sica: 118,
    nome: "LETICIA MOREIRA",
    gestor: "AMANDA SIMOES",
    email: "leticia.moreira@sakuratur.com.br",
    telefone: "21 99117-8741",
    link: "https://flysakura.com/cadastro?evento=site&executivo=9bffc7ad-f797-4c69-b1de-6fa172c500cd",
  },
  {
    sica: 17,
    nome: "LIDIANE RODRIGUES",
    gestor: "DOUGLAS MENDES",
    email: "lidiane.rodrigues@sakuratur.com.br",
    telefone: "68 99989-0144",
    link: "https://flysakura.com/cadastro?evento=site&executivo=fb5bcfaf-aae1-4ead-a0d4-d01201a2c006",
  },
  {
    sica: 72,
    nome: "LIGIA DIOS",
    gestor: "MIGUEL RAMOS",
    email: "ligia.dios@sakuratur.com.br",
    telefone: "11 94292-4170",
    link: "https://flysakura.com/cadastro?evento=site&executivo=280f82d7-1e01-4e77-a9d0-2fb7589b32c6",
  },
  {
    sica: 95,
    nome: "LUCAS BARBOSA",
    gestor: "THAIS BARRETO",
    email: "lucas.barbosa@sakuratur.com.br",
    telefone: null,
    link: "https://flysakura.com/cadastro?evento=site&executivo=e7536b37-ba93-4f86-b2c1-2ea9f71882be",
  },
  {
    sica: null,
    nome: "LUIS VARGAS",
    gestor: "LUIS VARGAS",
    email: "luis.vargas@sakuratur.com.br",
    telefone: "11 98168-3939",
    link: null,
    bases: ["CWB"],
  },
  {
    sica: 104,
    nome: "LUIZ CUNHA",
    gestor: "PEDRO CICCARELLI",
    email: "luiz.cunha@sakuratur.com.br",
    telefone: "65 99621-5535",
    link: "https://flysakura.com/cadastro?evento=site&executivo=7cc7682d-e27a-4aa5-989f-1d42c71e7050",
  },
  {
    sica: 25,
    nome: "LUIZ PEREZ",
    gestor: "DOUGLAS MENDES",
    email: "luiz.perez@sakuratur.com.br",
    telefone: "79 99929-3144",
    link: "https://flysakura.com/cadastro?evento=site&executivo=35d85ae2-5482-42c3-8b14-aff185f0db8a",
  },
  {
    sica: 124,
    nome: "LYDIANE FUKAYAMA",
    gestor: "RODRIGO GRANGHELLI",
    email: "lydiane.fukayama@sakuratur.com.br",
    telefone: null,
    link: "https://flysakura.com/cadastro?evento=site&executivo=7067feb6-1ecb-4966-9b6d-af93793945ee",
  },
  {
    sica: null,
    nome: "MARCEL MAZZONETTO",
    gestor: "MARCEL MAZZONETTO",
    email: "marcel.mazzonetto@sakuratur.com.br",
    telefone: "11 98886-6519",
    link: null,
    bases: ["SJP", "SJK", "PPB", "BAU", "RAO", "LDB", "UDI"],
  },
  {
    sica: 24,
    nome: "MARCELO MORAES",
    gestor: "DOUGLAS MENDES",
    email: "marcelo.moraes@sakuratur.com.br",
    telefone: "96 99127-8860",
    link: "https://flysakura.com/cadastro?evento=site&executivo=bd8ca360-79c3-428b-87aa-7822f7bf4a93",
  },
  {
    sica: 50,
    nome: "MARCO OLICHEVIS",
    gestor: "JOSINEI MOREIRA",
    email: "marco.olichevis@sakuratur.com.br",
    telefone: "41 99972-7805",
    link: "https://flysakura.com/cadastro?evento=site&executivo=adf557a3-a94b-42b3-864e-4264c767f079",
  },
  {
    sica: 128,
    nome: "MARIANA CARVALHO",
    gestor: "RODRIGO GRANGHELLI",
    email: "mariana.carvalho@sakuratur.com.br",
    telefone: null,
    link: "https://flysakura.com/cadastro?evento=site&executivo=2dcf26f2-6d00-47db-870b-319ce7b5249e",
  },
  {
    sica: 130,
    nome: "MARIE ELLEN",
    gestor: "MIGUEL RAMOS",
    email: "marie.ellen@sakuratur.com.br",
    telefone: "11 99877-5871",
    link: "https://flysakura.com/cadastro?evento=site&executivo=0bf7c4ac-53d5-4fae-b1c4-0b24af055626",
  },
  {
    sica: 84,
    nome: "MARTHA BASSO",
    gestor: "JOSINEI MOREIRA",
    email: "martha.basso@sakuratur.com.br",
    telefone: "41 99178-2559",
    link: "https://flysakura.com/cadastro?evento=site&executivo=d8246801-bd15-406d-85e2-017fece2f989",
  },
  {
    sica: 107,
    nome: "MEIRE GREEN",
    gestor: "KARLA SANTOS",
    email: "meire.green@sakuratur.com.br",
    telefone: "81 99925-7999",
    link: "https://flysakura.com/cadastro?evento=site&executivo=ffc3d3e4-4753-4b1d-b651-5eb1fc2346d8",
  },
  {
    sica: 96,
    nome: "MIGUEL RAMOS",
    gestor: "MIGUEL RAMOS",
    email: "miguel.ramos@sakuratur.com.br",
    telefone: "11 94107-7012",
    link: "https://flysakura.com/cadastro?evento=site&executivo=3815e751-c4a7-4fdd-b99e-fc4ab72ce654",
    bases: ["SAO", "IS"],
  },
  {
    sica: 21,
    nome: "MISIA MARTINS",
    gestor: "DOUGLAS MENDES",
    email: "misia.martins@sakuratur.com.br",
    telefone: "91 98303 5728",
    link: "https://flysakura.com/cadastro?evento=site&executivo=fc776981-1ada-45b7-b721-49341704c27d",
  },
  {
    sica: 103,
    nome: "NARA DANTAS",
    gestor: "PEDRO CICCARELLI",
    email: "nara.dantas@sakuratur.com.br",
    telefone: "62 99160-5436",
    link: "https://flysakura.com/cadastro?evento=site&executivo=83b50f9e-a5b7-47c6-bb46-afedb8fc7b5c",
  },
  {
    sica: 62,
    nome: "NATEL TIAGO",
    gestor: "MARCEL MAZZONETTO",
    email: "natel.tiago@sakuratur.com.br",
    telefone: "14 99819-6337",
    link: "https://flysakura.com/cadastro?evento=site&executivo=f43fbb82-fecc-4a70-b77c-bb07516a08ac",
  },
  {
    sica: 112,
    nome: "NEWTON BARRETO",
    gestor: "KARLA SANTOS",
    email: "newton.barreto@sakuratur.com.br",
    telefone: "82 99832-2325",
    link: "https://flysakura.com/cadastro?evento=site&executivo=d2bbd1ca-518a-41f5-b11e-bc024e020180",
  },
  {
    sica: 123,
    nome: "NIVEA CRISTINA",
    gestor: "RODRIGO GRANGHELLI",
    email: "nivea.cristina@sakuratur.com.br",
    telefone: null,
    link: "https://flysakura.com/cadastro?evento=site&executivo=a61b05af-8fd4-4bdf-8dd8-6df36528b01e",
  },
  {
    sica: 70,
    nome: "PAMELA PYRRHO",
    gestor: "AMANDA SIMOES",
    email: "pamela.pyrrho@sakuratur.com.br",
    telefone: "21 99996-0449",
    link: "https://flysakura.com/cadastro?evento=site&executivo=2d5d5980-9b49-420c-8f74-fa6c253e1d26",
  },
  {
    sica: 30,
    nome: "PAULA CAFIEIRO",
    gestor: "AMANDA SIMOES",
    email: "paula.cafieiro@sakuratur.com.br",
    telefone: "21 96745-9793",
    link: "https://flysakura.com/cadastro?evento=site&executivo=2ef59f07-205b-4406-b1e5-1484abbf05a1",
  },
  {
    sica: 90,
    nome: "PAULA FAGUNDES",
    gestor: "VICTOR OLIVEIRA",
    email: "paula.fagundes@sakuratur.com.br",
    telefone: "31 98888-0997",
    link: "https://flysakura.com/cadastro?evento=site&executivo=39be5df9-e3e1-4569-af8f-f1f990dd545e",
  },
  {
    sica: 12,
    nome: "PC - PAULO CESAR",
    gestor: "SEKAI",
    email: "paulo.cesar@sakuratur.com.br",
    telefone: "48 98802-7985",
    link: "https://flysakura.com/cadastro?evento=site&executivo=6c87387e-84d5-4a67-bca9-5b48c47d2c65",
  },
  {
    sica: 100,
    nome: "PEDRO CICCARELLI",
    gestor: "PEDRO CICCARELLI",
    email: "pedro.ciccarelli@sakuratur.com.br",
    telefone: "61 99333-0104",
    link: "https://flysakura.com/cadastro?evento=site&executivo=89499e66-789b-4d6c-9e74-ce04487539a5",
  },
  {
    sica: 122,
    nome: "RAFAEL CANALLI",
    gestor: "RODRIGO GRANGHELLI",
    email: "rafael.canalli@sakuratur.com.br",
    telefone: null,
    link: "https://flysakura.com/cadastro?evento=site&executivo=1127753d-5f98-4cd4-8266-abf0b69d6f0f",
  },
  {
    sica: 89,
    nome: "RAFAEL RIBEIRO",
    gestor: "MARCEL MAZZONETTO",
    email: "rafael.ribeiro@sakuratur.com.br",
    telefone: "17 98185-1766",
    link: "https://flysakura.com/cadastro?evento=site&executivo=3b3ef515-6a04-400a-a3b4-2f038d2a691c",
  },
  {
    sica: 121,
    nome: "RODRIGO GRANGHELLI",
    gestor: "RODRIGO GRANGHELLI",
    email: "rodrigo.granghelli@sakuratur.com.br",
    telefone: "19 98254-5953",
    link: "https://flysakura.com/cadastro?evento=site&executivo=038ec43b-cf9d-4898-8b76-a148018781af",
  },
  {
    sica: 88,
    nome: "SALLYTA LOPES",
    gestor: "MIGUEL RAMOS",
    email: "sallyta.lopes@sakuratur.com.br",
    telefone: "11 94532-7700",
    link: "https://flysakura.com/cadastro?evento=site&executivo=b0427060-0f3a-4f36-ad9c-e034e199a833",
  },
  {
    sica: 26,
    nome: "SANDRO MAROTA / GILBERTO GRUDKA",
    gestor: "SANDRO MAROTA",
    email: "sandro.marota@sakuratur.com.br / gilberto.grudka@sakuratur.com.br",
    telefone: "27 99901-5142 / 27 99233-3954",
    link: "https://flysakura.com/cadastro?evento=site&executivo=3fb1430f-c721-4bc1-8d2a-1f0e6258a6b8 / https://flysakura.com/cadastro?evento=site&executivo=52bb6ad1-0a16-49fd-86a1-a8d5765038fe",
    bases: ["VIX"],
  },
  {
    sica: 3,
    nome: "SAYURI TERAMOTO",
    gestor: "MIGUEL RAMOS",
    email: "sayuri.teramoto@sakuratur.com.br",
    telefone: "11 97342-7778",
    link: "https://flysakura.com/cadastro?evento=site&executivo=a7c3ab48-aa1c-4748-84fc-01f0a13752e4",
  },
  {
    sica: 131,
    nome: "SHIRLEY FERREIRA",
    gestor: "JOSINEI MOREIRA",
    email: "shirley.ferreira@sakuratur.com.br",
    telefone: "41 99517-5451",
    link: "https://flysakura.com/cadastro?evento=site&executivo=0b42fefd-85b6-4fac-bef4-7ffd475d0874",
  },
  {
    sica: 58,
    nome: "STELLA GALBETTI",
    gestor: "MARCEL MAZZONETTO",
    email: "stella.galbetti@sakuratur.com.br",
    telefone: "11 98261-7510",
    link: "https://flysakura.com/cadastro?evento=site&executivo=09810593-b4e3-4ef5-afda-21e10d9e74ed",
  },
  {
    sica: 29,
    nome: "SUPORTE COMERCIAL",
    gestor: "TAINARA DINI",
    email: "suporte.comercial@sakuratur.com.br",
    telefone: "51 99332-4472",
    link: "https://flysakura.com/cadastro?evento=site&executivo=7e7f88fe-93c0-45a4-8f3c-787e436aa3db",
  },
  {
    sica: null,
    nome: "TAINARA DINI",
    gestor: "TAINARA DINI",
    email: "tainara.dini@sakuratur.com.br",
    telefone: "51 99332-4472",
    link: null,
  },
  {
    sica: 94,
    nome: "TALITA MORO",
    gestor: "FERNANDO BLANCO",
    email: "talita.moro@sakuratur.com.br",
    telefone: "51 99598-7366",
    link: "https://flysakura.com/cadastro?evento=site&executivo=94e66982-1fd3-4d7d-a8e8-d0a326b48f25",
  },
  {
    sica: 11,
    nome: "THAIS BARRETO",
    gestor: "THAIS BARRETO",
    email: "thais.barreto@sakuratur.com.br",
    telefone: "71 99278-3455",
    link: "https://flysakura.com/cadastro?evento=site&executivo=dfc96abf-fc4a-4249-950c-83bd75883dec",
    bases: ["SSA"],
  },
  {
    sica: 63,
    nome: "THIAGO PEREIRA",
    gestor: "MARCEL MAZZONETTO",
    email: "thiago.pereira@sakuratur.com.br",
    telefone: "17 99135-2771",
    link: "https://flysakura.com/cadastro?evento=site&executivo=10aef8b1-5e97-4fdf-b455-2c7428390b1a",
  },
  {
    sica: 18,
    nome: "VALTER MATIAS",
    gestor: "DOUGLAS MENDES",
    email: "valter.matias@sakuratur.com.br",
    telefone: "11 98603-6518",
    link: "https://flysakura.com/cadastro?evento=site&executivo=61439481-0bd0-41d3-87ee-5f55a5f5783d",
  },
  {
    sica: 97,
    nome: "VICTOR OLIVEIRA",
    gestor: "VICTOR OLIVEIRA",
    email: "victor.oliveira@sakuratur.com.br",
    telefone: "21 98272-4760",
    link: "https://flysakura.com/cadastro?evento=site&executivo=e8c28d8e-ed07-4fae-b629-4113bed2c50f",
  },
  {
    sica: 78,
    nome: "WAGNER COTTA",
    gestor: "DOUGLAS MENDES",
    email: "wagner.cotta@sakuratur.com.br",
    telefone: "13 99162-9914",
    link: "https://flysakura.com/cadastro?evento=site&executivo=c0818e59-112f-4eaa-b41b-b82cb13390b4",
  },
];

// Extrai o(s) uuid(s) do parâmetro `?executivo=` de dentro de `link` —
// normalmente um só, mas a linha de SICA compartilhado (sócios com o
// mesmo código) tem dois links pessoais diferentes concatenados. `null`
// (promotor sem link pessoal, ver comentário de PROMOTORES) não tem uuid
// nenhum pra extrair.
function extrairLinkExecutivoId(link: string | null): string[] {
  if (!link) return [];
  const regex = /executivo=([0-9a-f-]{36})/gi;
  return [...link.matchAll(regex)]
    .map((match) => match[1])
    .filter((uuid): uuid is string => Boolean(uuid));
}

// Resolve o id do Gestor real (model próprio, 2026-08-03) a partir do nome
// anotado em `gestor` acima — mesma lógica find-or-create do backfill
// one-off (prisma/scripts/backfill-gestores.ts), cacheada por nome pra não
// repetir query pra cada promotor que reporta ao mesmo gestor.
async function resolverGestorId(
  prisma: PrismaClient,
  nome: string,
  cache: Map<string, string>,
): Promise<string> {
  const cacheado = cache.get(nome);
  if (cacheado) return cacheado;

  const gestor =
    (await prisma.gestor.findFirst({ where: { nome } })) ??
    (await prisma.gestor.create({ data: { nome } }));
  cache.set(nome, gestor.id);
  return gestor.id;
}

export async function seedPromotores(prisma: PrismaClient): Promise<void> {
  let totalBases = 0;
  const gestorIdPorNome = new Map<string, string>();

  for (const { bases = [], gestor: nomeGestor, ...dados } of PROMOTORES) {
    const gestorId = await resolverGestorId(prisma, nomeGestor, gestorIdPorNome);
    const linkExecutivoId = extrairLinkExecutivoId(dados.link);
    // Upsert por e-mail (não por sica): promotores só do export
    // "gerentes_conta" não têm sica, então não dá pra usá-lo como chave.
    const registro = await prisma.promotor.upsert({
      where: { email: dados.email },
      update: { ...dados, linkExecutivoId, gestorId },
      create: { ...dados, linkExecutivoId, gestorId },
    });

    for (const baseSigla of bases) {
      await prisma.promotorBase.upsert({
        where: { promotorId_baseSigla: { promotorId: registro.id, baseSigla } },
        update: {},
        create: { promotorId: registro.id, baseSigla },
      });
      totalBases += 1;
    }
  }

  console.warn(
    `Seed: ${PROMOTORES.length} promotores (executivos/gestores comerciais), ${gestorIdPorNome.size} gestores, ${totalBases} vínculos de base`,
  );
}
