 <h1 align="center">TIC TAC TOE</h1>
<div class="span8" >
  
  <h3>Players List</h3>
 
  <table class="table table-striped">
    <thead>
    
      <th></th>
    </thead>
    <tbody>
      {{#gamers}}
      <tr>
        <td width="100%">{{user_name}}</td>
        <td><a href="#" id="gamer_{{_id}}">invite</a></td>
      </tr>
      {{/gamers}}
    </tbody>
  </table>
</div>
