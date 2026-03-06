
// this file is generated — do not edit it


/// <reference types="@sveltejs/kit" />

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module only includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/private';
 * 
 * console.log(ENVIRONMENT); // => "production"
 * console.log(PUBLIC_BASE_URL); // => throws error during build
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/private' {
	export const SUPABASE_URL: string;
	export const SUPABASE_ANON_KEY: string;
	export const RETELL_API_KEY: string;
	export const ALLUSERSPROFILE: string;
	export const APPDATA: string;
	export const APPLICATIONINSIGHTS_CONFIGURATION_CONTENT: string;
	export const APPLICATION_INSIGHTS_NO_DIAGNOSTIC_CHANNEL: string;
	export const APPLICATION_INSIGHTS_NO_STATSBEAT: string;
	export const CHROME_CRASHPAD_PIPE_NAME: string;
	export const CommonProgramFiles: string;
	export const CommonProgramW6432: string;
	export const COMPUTERNAME: string;
	export const ComSpec: string;
	export const DEBUG: string;
	export const DriverData: string;
	export const ELECTRON_NO_ASAR: string;
	export const ELECTRON_RUN_AS_NODE: string;
	export const HOMEDRIVE: string;
	export const HOMEPATH: string;
	export const LOCALAPPDATA: string;
	export const LOGONSERVER: string;
	export const NODE_ENV: string;
	export const NUMBER_OF_PROCESSORS: string;
	export const OneDrive: string;
	export const OS: string;
	export const Path: string;
	export const PATHEXT: string;
	export const PROCESSOR_ARCHITECTURE: string;
	export const PROCESSOR_IDENTIFIER: string;
	export const PROCESSOR_LEVEL: string;
	export const PROCESSOR_REVISION: string;
	export const ProgramData: string;
	export const ProgramFiles: string;
	export const ProgramW6432: string;
	export const PSModulePath: string;
	export const PUBLIC: string;
	export const SESSIONNAME: string;
	export const SystemDrive: string;
	export const SystemRoot: string;
	export const TEMP: string;
	export const TMP: string;
	export const USERDOMAIN: string;
	export const USERDOMAIN_ROAMINGPROFILE: string;
	export const USERNAME: string;
	export const USERPROFILE: string;
	export const VSCEXT_ENABLE_PYTHON_BEST_EFFORTS_INSTALLATION: string;
	export const VSCEXT_MATCH_MANIFEST_VERSIONS: string;
	export const VSCEXT_PROXY_URL: string;
	export const VSCEXT_STACK_ANALYSIS_COMMAND: string;
	export const VSCEXT_TELEMETRY_ID: string;
	export const VSCEXT_TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND: string;
	export const VSCEXT_TRUSTIFY_DA_BACKEND_URL: string;
	export const VSCEXT_TRUSTIFY_DA_DOCKER_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_GO_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_GRADLE_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_IMAGE_PLATFORM: string;
	export const VSCEXT_TRUSTIFY_DA_MVN_ARGS: string;
	export const VSCEXT_TRUSTIFY_DA_MVN_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_NPM_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_PIP3_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_PIP_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_PNPM_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_PODMAN_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_PREFER_GRADLEW: string;
	export const VSCEXT_TRUSTIFY_DA_PREFER_MVNW: string;
	export const VSCEXT_TRUSTIFY_DA_PYTHON3_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_PYTHON_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_SKOPEO_CONFIG_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_SKOPEO_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_SYFT_CONFIG_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_SYFT_PATH: string;
	export const VSCEXT_TRUSTIFY_DA_YARN_PATH: string;
	export const VSCEXT_USE_GO_MVS: string;
	export const VSCEXT_USE_PIP_DEP_TREE: string;
	export const VSCEXT_USE_PYTHON_VIRTUAL_ENVIRONMENT: string;
	export const VSCEXT_UTM_SOURCE: string;
	export const VSCEXT_VULNERABILITY_ALERT_SEVERITY: string;
	export const VSCODE_CODE_CACHE_PATH: string;
	export const VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
	export const VSCODE_CWD: string;
	export const VSCODE_ESM_ENTRYPOINT: string;
	export const VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
	export const VSCODE_IPC_HOOK: string;
	export const VSCODE_L10N_BUNDLE_LOCATION: string;
	export const VSCODE_NLS_CONFIG: string;
	export const VSCODE_PID: string;
	export const WALLABY_PRODUCTION: string;
	export const windir: string;
}

/**
 * This module provides access to environment variables that are injected _statically_ into your bundle at build time and are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Static environment variables are [loaded by Vite](https://vitejs.dev/guide/env-and-mode.html#env-files) from `.env` files and `process.env` at build time and then statically injected into your bundle at build time, enabling optimisations like dead code elimination.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * For example, given the following build time environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { ENVIRONMENT, PUBLIC_BASE_URL } from '$env/static/public';
 * 
 * console.log(ENVIRONMENT); // => throws error during build
 * console.log(PUBLIC_BASE_URL); // => "http://site.com"
 * ```
 * 
 * The above values will be the same _even if_ different values for `ENVIRONMENT` or `PUBLIC_BASE_URL` are set at runtime, as they are statically replaced in your code with their build time values.
 */
declare module '$env/static/public' {
	export const PUBLIC_SUPABASE_URL: string;
	export const PUBLIC_SUPABASE_ANON_KEY: string;
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are limited to _private_ access.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Private_ access:**
 * 
 * - This module cannot be imported into client-side code
 * - This module includes variables that _do not_ begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) _and do_ start with [`config.kit.env.privatePrefix`](https://svelte.dev/docs/kit/configuration#env) (if configured)
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://site.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/private';
 * 
 * console.log(env.ENVIRONMENT); // => "production"
 * console.log(env.PUBLIC_BASE_URL); // => undefined
 * ```
 */
declare module '$env/dynamic/private' {
	export const env: {
		SUPABASE_URL: string;
		SUPABASE_ANON_KEY: string;
		RETELL_API_KEY: string;
		ALLUSERSPROFILE: string;
		APPDATA: string;
		APPLICATIONINSIGHTS_CONFIGURATION_CONTENT: string;
		APPLICATION_INSIGHTS_NO_DIAGNOSTIC_CHANNEL: string;
		APPLICATION_INSIGHTS_NO_STATSBEAT: string;
		CHROME_CRASHPAD_PIPE_NAME: string;
		CommonProgramFiles: string;
		CommonProgramW6432: string;
		COMPUTERNAME: string;
		ComSpec: string;
		DEBUG: string;
		DriverData: string;
		ELECTRON_NO_ASAR: string;
		ELECTRON_RUN_AS_NODE: string;
		HOMEDRIVE: string;
		HOMEPATH: string;
		LOCALAPPDATA: string;
		LOGONSERVER: string;
		NODE_ENV: string;
		NUMBER_OF_PROCESSORS: string;
		OneDrive: string;
		OS: string;
		Path: string;
		PATHEXT: string;
		PROCESSOR_ARCHITECTURE: string;
		PROCESSOR_IDENTIFIER: string;
		PROCESSOR_LEVEL: string;
		PROCESSOR_REVISION: string;
		ProgramData: string;
		ProgramFiles: string;
		ProgramW6432: string;
		PSModulePath: string;
		PUBLIC: string;
		SESSIONNAME: string;
		SystemDrive: string;
		SystemRoot: string;
		TEMP: string;
		TMP: string;
		USERDOMAIN: string;
		USERDOMAIN_ROAMINGPROFILE: string;
		USERNAME: string;
		USERPROFILE: string;
		VSCEXT_ENABLE_PYTHON_BEST_EFFORTS_INSTALLATION: string;
		VSCEXT_MATCH_MANIFEST_VERSIONS: string;
		VSCEXT_PROXY_URL: string;
		VSCEXT_STACK_ANALYSIS_COMMAND: string;
		VSCEXT_TELEMETRY_ID: string;
		VSCEXT_TRACK_RECOMMENDATION_ACCEPTANCE_COMMAND: string;
		VSCEXT_TRUSTIFY_DA_BACKEND_URL: string;
		VSCEXT_TRUSTIFY_DA_DOCKER_PATH: string;
		VSCEXT_TRUSTIFY_DA_GO_PATH: string;
		VSCEXT_TRUSTIFY_DA_GRADLE_PATH: string;
		VSCEXT_TRUSTIFY_DA_IMAGE_PLATFORM: string;
		VSCEXT_TRUSTIFY_DA_MVN_ARGS: string;
		VSCEXT_TRUSTIFY_DA_MVN_PATH: string;
		VSCEXT_TRUSTIFY_DA_NPM_PATH: string;
		VSCEXT_TRUSTIFY_DA_PIP3_PATH: string;
		VSCEXT_TRUSTIFY_DA_PIP_PATH: string;
		VSCEXT_TRUSTIFY_DA_PNPM_PATH: string;
		VSCEXT_TRUSTIFY_DA_PODMAN_PATH: string;
		VSCEXT_TRUSTIFY_DA_PREFER_GRADLEW: string;
		VSCEXT_TRUSTIFY_DA_PREFER_MVNW: string;
		VSCEXT_TRUSTIFY_DA_PYTHON3_PATH: string;
		VSCEXT_TRUSTIFY_DA_PYTHON_PATH: string;
		VSCEXT_TRUSTIFY_DA_SKOPEO_CONFIG_PATH: string;
		VSCEXT_TRUSTIFY_DA_SKOPEO_PATH: string;
		VSCEXT_TRUSTIFY_DA_SYFT_CONFIG_PATH: string;
		VSCEXT_TRUSTIFY_DA_SYFT_PATH: string;
		VSCEXT_TRUSTIFY_DA_YARN_PATH: string;
		VSCEXT_USE_GO_MVS: string;
		VSCEXT_USE_PIP_DEP_TREE: string;
		VSCEXT_USE_PYTHON_VIRTUAL_ENVIRONMENT: string;
		VSCEXT_UTM_SOURCE: string;
		VSCEXT_VULNERABILITY_ALERT_SEVERITY: string;
		VSCODE_CODE_CACHE_PATH: string;
		VSCODE_CRASH_REPORTER_PROCESS_TYPE: string;
		VSCODE_CWD: string;
		VSCODE_ESM_ENTRYPOINT: string;
		VSCODE_HANDLES_UNCAUGHT_ERRORS: string;
		VSCODE_IPC_HOOK: string;
		VSCODE_L10N_BUNDLE_LOCATION: string;
		VSCODE_NLS_CONFIG: string;
		VSCODE_PID: string;
		WALLABY_PRODUCTION: string;
		windir: string;
		[key: `PUBLIC_${string}`]: undefined;
		[key: `${string}`]: string | undefined;
	}
}

/**
 * This module provides access to environment variables set _dynamically_ at runtime and that are _publicly_ accessible.
 * 
 * |         | Runtime                                                                    | Build time                                                               |
 * | ------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
 * | Private | [`$env/dynamic/private`](https://svelte.dev/docs/kit/$env-dynamic-private) | [`$env/static/private`](https://svelte.dev/docs/kit/$env-static-private) |
 * | Public  | [`$env/dynamic/public`](https://svelte.dev/docs/kit/$env-dynamic-public)   | [`$env/static/public`](https://svelte.dev/docs/kit/$env-static-public)   |
 * 
 * Dynamic environment variables are defined by the platform you're running on. For example if you're using [`adapter-node`](https://github.com/sveltejs/kit/tree/main/packages/adapter-node) (or running [`vite preview`](https://svelte.dev/docs/kit/cli)), this is equivalent to `process.env`.
 * 
 * **_Public_ access:**
 * 
 * - This module _can_ be imported into client-side code
 * - **Only** variables that begin with [`config.kit.env.publicPrefix`](https://svelte.dev/docs/kit/configuration#env) (which defaults to `PUBLIC_`) are included
 * 
 * > [!NOTE] In `dev`, `$env/dynamic` includes environment variables from `.env`. In `prod`, this behavior will depend on your adapter.
 * 
 * > [!NOTE] To get correct types, environment variables referenced in your code should be declared (for example in an `.env` file), even if they don't have a value until the app is deployed:
 * >
 * > ```env
 * > MY_FEATURE_FLAG=
 * > ```
 * >
 * > You can override `.env` values from the command line like so:
 * >
 * > ```sh
 * > MY_FEATURE_FLAG="enabled" npm run dev
 * > ```
 * 
 * For example, given the following runtime environment:
 * 
 * ```env
 * ENVIRONMENT=production
 * PUBLIC_BASE_URL=http://example.com
 * ```
 * 
 * With the default `publicPrefix` and `privatePrefix`:
 * 
 * ```ts
 * import { env } from '$env/dynamic/public';
 * console.log(env.ENVIRONMENT); // => undefined, not public
 * console.log(env.PUBLIC_BASE_URL); // => "http://example.com"
 * ```
 * 
 * ```
 * 
 * ```
 */
declare module '$env/dynamic/public' {
	export const env: {
		PUBLIC_SUPABASE_URL: string;
		PUBLIC_SUPABASE_ANON_KEY: string;
		[key: `PUBLIC_${string}`]: string | undefined;
	}
}
