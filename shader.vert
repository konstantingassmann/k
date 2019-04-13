precision mediump float;

attribute vec2 a_position;
attribute vec2 a_texCoord;

uniform mat3 u_matrix;
uniform vec2 u_velocity;

varying vec2 v_texCoord;

void main () {
  vec3 position = u_matrix * vec3(a_position, 1.);
  gl_Position = vec4(
    position.x + (u_velocity.x * 0.01 * sin(a_texCoord.y + 1.2)),
    position.y + (u_velocity.y * 0.01 * sin(a_texCoord.x * 2. + 0.5)),
    0.,
    1.
  );

  v_texCoord = a_texCoord;
}