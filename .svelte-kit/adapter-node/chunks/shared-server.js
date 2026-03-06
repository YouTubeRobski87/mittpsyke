let private_env = {};
let public_env = {};
function set_private_env(environment) {
  private_env = environment;
}
function set_public_env(environment) {
  public_env = environment;
}
export {
  public_env as a,
  set_public_env as b,
  private_env as p,
  set_private_env as s
};
