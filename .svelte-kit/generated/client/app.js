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
	() => import('./nodes/23')
];

export const server_loads = [];

export const dictionary = {
		"/": [2],
		"/angest": [3],
		"/ansvar": [4],
		"/chat/[category]": [5],
		"/dagbok": [6],
		"/dashboard": [7],
		"/dashboard/installningar": [8],
		"/depression": [9],
		"/ensamhet": [10],
		"/guider-seo": [13],
		"/guider-seo/[pillar]": [14],
		"/guider-seo/[pillar]/[guide]": [15],
		"/guider": [11],
		"/guider/[pillar]": [12],
		"/integritet": [16],
		"/login": [17],
		"/om-mittpsyke": [18],
		"/ovningar": [19],
		"/ovningar/[tool]": [20],
		"/panikattack": [21],
		"/portal/[slug]": [22],
		"/register": [23]
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