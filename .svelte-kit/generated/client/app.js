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
	() => import('./nodes/42')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/ai-samtalsstod-online": [3],
		"/andningsovningar-mot-angest": [4],
		"/angest": [5],
		"/anonymt-samtalsstod-online": [6],
		"/ansvar": [7],
		"/avregistrera": [~8],
		"/chat/[category]": [9],
		"/dagbok": [10],
		"/dashboard": [11],
		"/dashboard/installningar": [12],
		"/depression": [13],
		"/digital-dagbok-for-maende": [14],
		"/ensamhet": [15],
		"/framsteg": [~16],
		"/guider-seo": [19],
		"/guider-seo/[pillar]": [20],
		"/guider-seo/[pillar]/[guide]": [21],
		"/guider": [17],
		"/guider/[pillar]": [18],
		"/hjalp-mot-oro-online": [22],
		"/hjalp-vid-angest-online": [23],
		"/hjalp-vid-depression-online": [24],
		"/integritet": [25],
		"/login": [~26],
		"/nedstamdhet": [27],
		"/om-mittpsyke": [28],
		"/oro": [29],
		"/ovningar-mot-angest-online": [32],
		"/ovningar": [30],
		"/ovningar/[tool]": [31],
		"/panikattack": [33],
		"/portal/[slug]": [34],
		"/prata-anonymt-online": [35],
		"/psykiskt-stod-online": [36],
		"/register": [~37],
		"/samtalsstod-utan-vantetid": [38],
		"/samtalsstod-vid-trauma": [39],
		"/stod-vid-stress-online": [40],
		"/stress": [41],
		"/trauma": [42]
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