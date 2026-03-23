<script>
  let {
    size = 24,
    color = 'currentColor',
    class: className = '',
    ...rest
  } = $props();
</script>

<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width={size}
  height={size}
  class={className}
  aria-hidden="true"
  style:color={color}
  {...rest}
>
  <g stroke-linecap="square" stroke-miterlimit="10" stroke-linejoin="miter" fill="currentColor" stroke="currentColor">
    <path fill="none" stroke-width="2" d="M2.2,10C3.127,5.435,7.162,2,12,2 c2.726,0,5.198,1.091,7.002,2.86" stroke-linecap="butt"></path>
    <polygon fill="none" stroke-width="2" points="16,7 21,2 22,8"></polygon>
    <polygon stroke="none" points="16,7 21,2 22,8"></polygon>
    <path fill="none" stroke-width="2" d="M21.8,14c-0.927,4.564-4.962,8-9.8,8 c-2.726,0-5.198-1.091-7.002-2.86" stroke-linecap="butt"></path>
    <polygon fill="none" stroke-width="2" points="8,17 3,22 2,16"></polygon>
    <polygon stroke="none" points="8,17 3,22 2,16"></polygon>
  </g>
</svg>
