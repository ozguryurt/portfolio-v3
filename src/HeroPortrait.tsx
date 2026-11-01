import { useEffect, useRef } from "react";

// The texture is the remote photograph. WebGL only supplies the reference's
// scroll-driven grain dissolve and warm cursor light, with an <img> fallback.
const vertex = `attribute vec2 aPosition; varying vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
const fragment = `precision highp float;
uniform sampler2D uPhoto;
uniform vec2 uSize,uPhotoSize,uPointer;
uniform float uProgress,uTime;
varying vec2 vUv;
float random(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float grain(vec2 p){vec2 cell=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(random(cell),random(cell+vec2(1.,0.)),f.x),mix(random(cell+vec2(0.,1.)),random(cell+1.),f.x),f.y);}
float cloud(vec2 p){float result=0.,weight=.5;for(int i=0;i<4;i++){result+=grain(p)*weight;p*=2.03;weight*=.5;}return result;}
void main(){
 vec2 uv=vUv; uv.y+=uProgress*.05*(uv.y-.5);
 float frameRatio=uSize.x/uSize.y,photoRatio=uPhotoSize.x/uPhotoSize.y;
 vec2 fit=frameRatio<photoRatio?vec2(frameRatio/photoRatio,1.):vec2(1.,photoRatio/frameRatio);
 vec2 sampleUv=(uv-.5)*fit+.5;
 vec3 photo=texture2D(uPhoto,sampleUv).rgb;
 float distance=length((vUv-uPointer)*vec2(frameRatio,1.));
 float radius=uSize.x<600.?.28:.235;
 float light=exp(-distance*distance/(radius*radius));
 float luminance=dot(photo,vec3(.299,.587,.114));
 vec3 dark=mix(vec3(luminance),photo,.45)*.27*vec3(1.05,.94,.84);
 vec3 lit=photo*(1.06+.22*light)+vec3(.94,.62,.3)*.09*light;
 vec3 color=mix(dark,lit,smoothstep(0.,1.,light));
 float textureNoise=cloud(vUv*vec2(2.6,4.2)+vec2(0.,uTime*.015));
 float threshold=mix(textureNoise,random(floor(vUv*uSize/2.5)),.55);
 float dissolve=1.-smoothstep(threshold-.05,threshold+.05,uProgress*1.25-.12);
 float ember=smoothstep(threshold-.09,threshold,uProgress*1.25-.12)*dissolve;
 color+=vec3(.95,.58,.26)*ember*.45;
 color+=(random(vUv*uSize+fract(uTime)*91.7)-.5)*.045;
 float edge=smoothstep(0.,.3,vUv.x)*smoothstep(0.,.2,vUv.y);
 gl_FragColor=vec4(color,edge*dissolve);
}`;

export function HeroPortrait({
  src,
  motion,
}: {
  src: string;
  motion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!motion) return;
    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) return;
    const shaders: WebGLShader[] = [];
    const compile = (type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      shaders.push(shader);
      return shader;
    };
    const vs = compile(gl.VERTEX_SHADER, vertex),
      fs = compile(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) {
      shaders.forEach((s) => gl.deleteShader(s));
      return;
    }
    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      shaders.forEach((s) => gl.deleteShader(s));
      gl.deleteProgram(program);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "aPosition");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const uniforms = Object.fromEntries(
      ["uSize", "uPhotoSize", "uPointer", "uProgress", "uTime"].map((name) => [
        name,
        gl.getUniformLocation(program, name),
      ]),
    );
    let frame = 0,
      loaded = false,
      disposed = false,
      visible = false;
    let x = 0.5,
      y = 0.6,
      targetX = x,
      targetY = y;
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => {
      if (disposed) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
      );
      gl.uniform2f(
        uniforms.uPhotoSize,
        image.naturalWidth,
        image.naturalHeight,
      );
      canvas.classList.add("is-ready");
      loaded = true;
      syncDrawing();
    };
    image.src = src;
    const resize = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = Math.min(
        devicePixelRatio || 1,
        innerWidth <= 900 ? 1.5 : 1.75,
      );
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uniforms.uSize, width, height);
    });
    resize.observe(canvas);
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      syncDrawing();
    });
    visibility.observe(canvas);
    const pointer = (event: globalThis.PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetX = (event.clientX - rect.left) / rect.width;
      targetY = 1 - (event.clientY - rect.top) / rect.height;
    };
    const reset = () => {
      targetX = 0.5;
      targetY = 0.6;
    };
    canvas.parentElement!.addEventListener("pointermove", pointer);
    canvas.parentElement!.addEventListener("pointerleave", reset);
    const draw = (time: number) => {
      frame = 0;
      if (disposed || !loaded || !visible || document.hidden) return;
      x += (targetX - x) * 0.1;
      y += (targetY - y) * 0.1;
      gl.uniform2f(uniforms.uPointer, x, y);
      gl.uniform1f(uniforms.uTime, time / 1000);
      gl.uniform1f(
        uniforms.uProgress,
        Number.parseFloat(
          canvas.parentElement!.style.getPropertyValue("--dissolve"),
        ) || 0,
      );
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frame = requestAnimationFrame(draw);
    };
    // Stop scheduling frames entirely outside the viewport or in a hidden tab.
    function syncDrawing() {
      if (!disposed && loaded && visible && !document.hidden) {
        if (!frame) frame = requestAnimationFrame(draw);
      } else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }
    document.addEventListener("visibilitychange", syncDrawing);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      resize.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", syncDrawing);
      canvas.parentElement?.removeEventListener("pointermove", pointer);
      canvas.parentElement?.removeEventListener("pointerleave", reset);
      image.onload = null;
      canvas.classList.remove("is-ready");
      gl.deleteTexture(texture);
      gl.deleteBuffer(buffer);
      shaders.forEach((s) => gl.deleteShader(s));
      gl.deleteProgram(program);
    };
  }, [src, motion]);
  return (
    <canvas ref={canvasRef} className="portrait-canvas" aria-hidden="true" />
  );
}
