const menuToggle = document.getElementById('menu-toggle');
const menu = document.getElementById('menu');
menuToggle.addEventListener('click', ()=>{
    menu.classList.toggle('active');
    menu.style.display = menu.classList.contains('active')?'flex':'none';
});
