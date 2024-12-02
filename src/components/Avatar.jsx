import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";

export function Avatar({ animation }) {
  const { headFollow, cursorFollow, wireframe } = useControls({
    headFollow: false,
    cursorFollow: false,
    wireframe: false,
  });

  const group = useRef();

  // Load the main avatar model
  const { nodes, materials } = useGLTF("/models/maharaja_avatar.glb");

  // Preload all animations once and cache them
  const { animations: typingAnimation } = useGLTF("animations/Typing.glb");
  const { animations: standingAnimation } = useGLTF(
    "animations/Standing Idle.glb"
  );
  const { animations: fallingAnimation } = useGLTF(
    "animations/Falling Idle.glb"
  );

  // Explicitly name animations
  typingAnimation[0].name = "Typing";
  standingAnimation[0].name = "Standing";
  fallingAnimation[0].name = "Falling";

  // Combine animations and initialize useAnimations
  const { actions, mixer } = useAnimations(
    [typingAnimation[0], standingAnimation[0], fallingAnimation[0]],
    group
  );

  // Eagerly play and stop all animations during setup
  useEffect(() => {
    if (actions) {
      Object.values(actions).forEach((action) => {
        action.play().halt(0); // Start and immediately stop the animation
      });
    }
  }, [actions]);

  // Handle animation changes
  useEffect(() => {
    if (actions && animation) {
      // Stop the currently playing action and switch to the new animation
      Object.values(actions).forEach((action) => action.stop());
      const action = actions[animation];
      if (action) {
        action.reset().fadeIn(0).play(); // Smooth and immediate transition
      }
    }
  }, [animation, actions]);

  // Handle frame updates for mixer and head/cursor follow
  useFrame((state) => {
    if (mixer) {
      mixer.update(state.clock.getDelta());
    }

    // Keep the avatar facing forward
    if (group.current) {
      group.current.rotation.set(0, 0, 0); // Now facing the positive z-axis // Ensure consistent forward direction
    }

    if (headFollow && group.current) {
      const head = group.current.getObjectByName("Head");
      if (head) {
        head.lookAt(state.camera.position);
      }
    }

    if (cursorFollow && group.current) {
      const spine = group.current.getObjectByName("Spine2");
      if (spine) {
        const target = new THREE.Vector3(state.mouse.x, state.mouse.y, 1);
        spine.lookAt(target);
      }
    }
  });

  // Update materials for wireframe mode
  useEffect(() => {
    if (materials) {
      Object.values(materials).forEach((material) => {
        material.wireframe = wireframe;
      });
    }
  }, [wireframe, materials]);

  return (
    <group ref={group}>
      <primitive object={nodes.Armature} />
    </group>
  );
}

// Preload all necessary GLTF files to ensure zero delay
useGLTF.preload("/models/maharaja_avatar.glb");
useGLTF.preload("animations/Typing.glb");
useGLTF.preload("animations/Standing Idle.glb");
useGLTF.preload("animations/Falling Idle.glb");
