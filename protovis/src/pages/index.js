import {useRef, useEffect, useState} from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import * as Tone from 'tone';

import styles from '../styles/Home.module.css';

const MINMAXES = {
  min: {x: -229596, y: -2823097, z: -14544},
  max: {x: 616165, y: 212434, z: 16519},
};

const maprange = (value, x1, y1, x2, y2) =>
  ((value - x1) * (y2 - x2)) / (y1 - x1) + x2;

function toEuler(q) {
  let sinr_cosp = 2 * (q[3] * q[0] + q[1] * q[2]);
  let cosr_cosp = 1 - 2 * (q[0] * q[0] + q[1] * q[1]);
  let roll = Math.atan2(sinr_cosp, cosr_cosp);

  let sinp = 2 * (q[3] * q[1] - q[2] * q[0]);
  let pitch = Math.asin(sinp);
  if (Math.abs(sinp) >= 1) {
    pitch = (Math.PI / 2) * Math.sign(sinp);
  }

  let siny_cosp = 2 * (q[3] * q[2] + q[0] * q[1]);
  let cosy_cosp = 1 - 2 * (q[1] * q[1] + q[2] * q[2]);
  let yaw = Math.atan2(siny_cosp, cosy_cosp);

  return [yaw, roll, pitch];
}

function calcDist(angle, initAngle) {
  angle = (angle - initAngle) * (180 / Math.PI);
  angle = angle < 0 ? angle + 360 : angle;
  angle = angle > 180 ? angle - 360 : angle;

  let dist = Math.round(-800 * Math.tan(angle * (Math.PI / 180)));
  return dist;
}

export default function Home() {
  const [orientationDebugText, setOrientationDebugText] = useState('');
  const [motionDebugText, setMotionDebugText] = useState('');
  const [locationDebugText, setLocationDebugText] = useState('');

  const [permissionGranted, setPermissionGranted] = useState(false);
  const [muted, setMuted] = useState(true);
  const [noteFreq, setNoteFreq] = useState(440);
  const locationRef = useRef({x: 0, y: 0, z: 0, velX: 0, velY: 0, velZ: 0});
  const [mainSynth, setMainSynth] = useState();
  const [mainEnv, setMainEnv] = useState();
  const [lfoVal, setLfoVal] = useState(1000);
  const [absOrientationSensor, setAbsOrientationSensor] = useState();
  const [initAngle, setInitAngle] = useState(null);
  const minMaxRef = useRef({
    max: {x: -Infinity, y: -Infinity, z: -Infinity},
    min: {x: Infinity, y: Infinity, z: Infinity},
  });

  useEffect(() => {
    (async () => {})();
  }, []);

  useEffect(() => {
    Tone.Destination.mute = muted;
  }, [muted]);

  useEffect(() => {
    if (permissionGranted) {
      const mainEnv = new Tone.AmplitudeEnvelope({
        attack: 0.5,
        decay: 0.1,
        sustain: 1,
      });
      setMainEnv(mainEnv);
    }
  }, [permissionGranted]);

  useEffect(() => {
    if (mainEnv) {
      setMainSynth(
        new Tone.PolySynth(Tone.Synth, {
          oscillator: {type: 'sine'},
          envelope: mainEnv,
        }).toDestination(),
      );
    }
  }, [mainEnv]);

  useEffect(() => {
    if (mainSynth) {
      const intervalId = setInterval(() => {
        console.log('trig', locationRef.current);
        mainSynth.triggerAttackRelease(
          Math.max(
            maprange(
              locationRef.current.x,
              MINMAXES.min.x,
              MINMAXES.max.x,
              0,
              15000,
            ),
            0,
          ),
          lfoVal / 2 / 1000,
          '+0',
          0.5,
        );
      }, lfoVal);
      return () => {
        console.log('clear');
        clearInterval(intervalId);
      };
    }
  }, [mainSynth]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Vision</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <pre>{orientationDebugText}</pre>
      <pre>{motionDebugText}</pre>
      <pre>{locationDebugText}</pre>
      <div
        className={styles.muteButton}
        onClick={async () => {
          if (!permissionGranted && muted) {
            await Tone.start();
            if (
              location.protocol === 'https:' &&
              typeof DeviceMotionEvent.requestPermission === 'function'
            ) {
              DeviceMotionEvent.requestPermission().then(async (resp) => {
                if (resp === 'granted') {
                  setPermissionGranted(true);
                  //window.addEventListener(
                  //'deviceorientation',
                  //(e) => {
                  //setOrientationDebugText(
                  //'a: ' +
                  //e.alpha.toFixed(2) +
                  //'\n' +
                  //'b: ' +
                  //e.beta.toFixed(2) +
                  //'\n' +
                  //'g: ' +
                  //e.gamma.toFixed(2) +
                  //'\n',
                  //);
                  //},
                  //true,
                  //);
                  //window.addEventListener(
                  //'devicemotion',
                  //(e) => {
                  //setMotionDebugText(
                  //'x: ' +
                  //e.acceleration.x +
                  //'\n' +
                  //'y: ' +
                  //e.acceleration.y +
                  //'\n' +
                  //'z: ' +
                  //e.acceleration.z +
                  //'\n',
                  //);
                  //locationRef.current.velX =
                  //locationRef.current.velX +
                  //e.acceleration.x * e.interval;
                  //locationRef.current.velY =
                  //locationRef.current.velY +
                  //e.acceleration.y * e.interval;
                  //locationRef.current.velZ =
                  //locationRef.current.velZ +
                  //e.acceleration.z * e.interval;
                  //locationRef.current.x =
                  //locationRef.current.x +
                  //locationRef.current.velX * e.interval;
                  //locationRef.current.y =
                  //locationRef.current.y +
                  //locationRef.current.velY * e.interval;
                  //locationRef.current.z =
                  //locationRef.current.z +
                  //locationRef.current.velZ * e.interval;
                  //setLocationDebugText(
                  //'locX' +
                  //locationRef.current.x +
                  //'\n' +
                  //'locY' +
                  //locationRef.current.y +
                  //'\n' +
                  //locationRef.current.z,
                  //);
                  //},
                  //true,
                  //);

                  const MotionSensors = await import('../motion-sensors.js');
                  const {
                    AbsoluteOrientationSensor,
                    LinearAccelerationSensor,
                  } = MotionSensors;
                  const absOSensor = new AbsoluteOrientationSensor();
                  //const linearASensor = new LinearAccelerationSensor({
                  //frequency: 60,
                  //});
                  //const results = await Promise.all([
                  //navigator.permissions.query({name: 'accelerometer'}),
                  //navigator.permissions.query({name: 'magnetometer'}),
                  //navigator.permissions.query({name: 'gyroscope'}),
                  //]);
                  //if (results.every((result) => result.state === 'granted')) {
                  //setAbsOrientationSensor(absOSensor);
                  //absOSensor.start();
                  //} else {
                  //console.log('No permissions to use AbsoluteOrientationSensor.');
                  //}
                  absOSensor.addEventListener('reading', () => {
                    const angles = toEuler(absOSensor.quaternion);
                    if (initAngle == null) {
                      setInitAngle(angles);
                    }
                    const dist = angles.map((angle, i) =>
                      calcDist(angle, initAngle ? initAngle[i] : 0),
                    );
                    setLocationDebugText(
                      'x: ' +
                        dist[0] +
                        '\n' +
                        'y: ' +
                        dist[1] +
                        '\n' +
                        'z: ' +
                        dist[2] +
                        '\n',
                    );
                    locationRef.current.x = dist[0];
                    locationRef.current.y = dist[1];
                    locationRef.current.z = dist[2];
                    minMaxRef.current.max.x = Math.max(
                      minMaxRef.current.max.x,
                      dist[0],
                    );
                    minMaxRef.current.max.y = Math.max(
                      minMaxRef.current.max.y,
                      dist[1],
                    );
                    minMaxRef.current.max.z = Math.max(
                      minMaxRef.current.max.z,
                      dist[2],
                    );
                    minMaxRef.current.min.x = Math.min(
                      minMaxRef.current.min.x,
                      dist[0],
                    );
                    minMaxRef.current.min.y = Math.min(
                      minMaxRef.current.min.y,
                      dist[1],
                    );
                    minMaxRef.current.min.z = Math.min(
                      minMaxRef.current.min.z,
                      dist[2],
                    );
                  });
                  absOSensor.addEventListener('error', (event) => {
                    if (event.error.name == 'NotReadableError') {
                      console.log('Sensor is not available.');
                    }
                  });
                  //linearASensor.addEventListener('reading', () => {
                  //locationRef.current.velX += linearASensor.x / 60;
                  //locationRef.current.x += locationRef.current.velX / 60;
                  //setLocationDebugText(
                  //'x: ' +
                  //locationRef.current.x +
                  //'\n' +
                  //'velX: ' +
                  //locationRef.current.velX,
                  //);
                  //});
                  //linearASensor.addEventListener('error', (error) => {
                  //if (event.error.name == 'NotReadableError') {
                  //console.log('Sensor is not available.');
                  //}
                  //});
                  setAbsOrientationSensor(absOSensor);
                  absOSensor.start();
                  //linearASensor.start();
                } else {
                  console.log('failed perm');
                }
              });
            } else {
              // desktop catch
              setPermissionGranted(true);
            }
          }
          setMuted(!muted);
        }}
      />
    </div>
  );
}
