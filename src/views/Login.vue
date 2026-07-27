<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth.store";

const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  email: "",
  password: "",
  remember: false,
});

const login = async () => {
  try {
    await authStore.login(form);

    router.push("/products");
  } catch (error) {
    alert("Correo o contraseña incorrectos");
    console.error(error);
  }
};
</script>

<template>
  <div class="login">

    <div class="login__card">

      <div class="login__header">

        <div class="login__logo">
          📦
        </div>

        <h1>Inventario</h1>

        <p>Inicia sesión para continuar</p>

      </div>

      <form
        class="login__form"
        @submit.prevent="login"
      >

        <div class="login__group">

          <label>Correo electrónico</label>

          <input
            v-model="form.email"
            type="email"
            placeholder="usuario@ejemplo.com"
          />

        </div>

        <div class="login__group">

          <label>Contraseña</label>

          <input
            v-model="form.password"
            type="password"
            placeholder="••••••••"
          />

        </div>

        <div class="login__options">

          <label>

            <input
              v-model="form.remember"
              type="checkbox"
            />

            Recordarme

          </label>

        </div>

        <button class="login__button">

          Iniciar sesión

        </button>

      </form>

    </div>

  </div>
</template>

<style scoped>
.login {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;

    background: #f5f7fb;
}

.login__card {

    width: 430px;

    background: white;

    border-radius: 14px;

    padding: 45px;

    box-shadow: 0 20px 50px rgba(0,0,0,.12);

}

.login__header{

    text-align:center;

    margin-bottom:35px;

}

.login__logo{

    width:65px;
    height:65px;

    margin:auto;

    display:flex;
    align-items:center;
    justify-content:center;

    border-radius:12px;

    background:#2f67f6;

    color:white;

    font-size:34px;

    margin-bottom:20px;

}

.login__header h1{

    margin:0;

    font-size:34px;

    color:#111827;

}

.login__header p{

    margin-top:8px;

    color:#6b7280;

}

.login__group{

    display:flex;

    flex-direction:column;

    margin-bottom:22px;

}

.login__group label{

    margin-bottom:8px;

    font-size:14px;

    color:#374151;

}

.login__group input{

    height:48px;

    border:1px solid #d1d5db;

    border-radius:8px;

    padding:0 15px;

    font-size:15px;

    outline:none;

    transition:.3s;

}

.login__group input:focus{

    border-color:#2563eb;

}

.login__options{

    margin-bottom:25px;

    color:#4b5563;

    font-size:14px;

}

.login__button{

    width:100%;

    height:50px;

    border:none;

    border-radius:8px;

    background:#2563eb;

    color:white;

    font-size:16px;

    cursor:pointer;

    transition:.3s;

}

.login__button:hover{

    background:#1d4ed8;

}
</style>