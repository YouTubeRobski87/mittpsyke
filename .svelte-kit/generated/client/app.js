export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28'),
	() => import('./nodes/29'),
	() => import('./nodes/30'),
	() => import('./nodes/31'),
	() => import('./nodes/32'),
	() => import('./nodes/33'),
	() => import('./nodes/34'),
	() => import('./nodes/35'),
	() => import('./nodes/36'),
	() => import('./nodes/37'),
	() => import('./nodes/38'),
	() => import('./nodes/39'),
	() => import('./nodes/40'),
	() => import('./nodes/41'),
	() => import('./nodes/42'),
	() => import('./nodes/43'),
	() => import('./nodes/44'),
	() => import('./nodes/45')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/4-7-8-andning-ovning": [3],
		"/ai-samtalsstod-online": [4],
		"/andningsovningar-mot-angest": [5],
		"/angest": [6],
		"/anonymt-samtalsstod-online": [7],
		"/ansvar": [8],
		"/avregistrera": [~9],
		"/chat/[category]": [10],
		"/dagbok": [11],
		"/dashboard": [12],
		"/dashboard/installningar": [13],
		"/depression": [14],
		"/digital-dagbok-for-maende": [15],
		"/ensamhet": [16],
		"/exponering-ovningar-mot-angest": [17],
		"/framsteg": [~18],
		"/guider-seo": [21],
		"/guider-seo/[pillar]": [22],
		"/guider-seo/[pillar]/[guide]": [23],
		"/guider": [19],
		"/guider/[pillar]": [20],
		"/hjalp-mot-oro-online": [24],
		"/hjalp-vid-angest-online": [25],
		"/hjalp-vid-depression-online": [26],
		"/integritet": [27],
		"/login": [~28],
		"/nedstamdhet": [29],
		"/om-mittpsyke": [30],
		"/oro": [31],
		"/ovningar-mot-angest-online": [34],
		"/ovningar": [32],
		"/ovningar/[tool]": [33],
		"/panikattack": [35],
		"/portal/[slug]": [36],
		"/prata-anonymt-online": [37],
		"/psykiskt-stod-online": [38],
		"/register": [~39],
		"/samtalsstod-utan-vantetid": [40],
		"/samtalsstod-vid-trauma": [41],
		"/stod-vid-ptsd-online": [42],
		"/stod-vid-stress-online": [43],
		"/stress": [44],
		"/trauma": [45]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));
export const encoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.encode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';