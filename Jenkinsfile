pipeline {
  agent any

  environment {
    IMAGE_NAME = "devops-app"
    IMAGE_TAG  = "1"
    KUBECONFIG = "/tmp/kubeconfig-linux"
    MINIKUBE_HOME = "/var/jenkins_home/.minikube"
  }

  tools {
    nodejs "node18"
  }

  stages {

    stage("Checkout") {
      steps {
        checkout scm
      }
    }

    stage("Install Dependencies") {
      steps {
        sh "npm ci"
      }
    }

    stage("Run Tests") {
      steps {
        sh '''
          set -eux
          echo "--- Backend + Frontend tests ---"
          npm run test:my:coverage
        '''
      }
    }

    stage("Tools Check") {
      steps {
        sh '''
          set -eux
          echo "--- TOOL VERSIONS ---"
          node -v
          npm -v
          kubectl version --client
          minikube version
        '''
      }
    }

    stage("Write kubeconfig") {
      steps {
        sh '''
          set -eux
          cat > /tmp/kubeconfig-linux <<'EOF'
apiVersion: v1
kind: Config
clusters:
- name: minikube
  cluster:
    certificate-authority: /var/jenkins_home/.minikube/ca.crt
    server: https://minikube:8443
contexts:
- name: minikube
  context:
    cluster: minikube
    user: minikube
current-context: minikube
users:
- name: minikube
  user:
    client-certificate: /var/jenkins_home/.minikube/profiles/minikube/client.crt
    client-key: /var/jenkins_home/.minikube/profiles/minikube/client.key
EOF
        '''
      }
    }

    stage("Build Image into Minikube") {
      steps {
        sh '''
          set -eux

          # Build fresh locally (Jenkins docker daemon)
          docker build --no-cache -t ${IMAGE_NAME}:${IMAGE_TAG} .

          # IMPORTANT: remove old tag from minikube so load cannot "skip/keep old"
          minikube -p minikube image rm ${IMAGE_NAME}:${IMAGE_TAG} || true

          # Load freshly built image into minikube node
          minikube -p minikube image load ${IMAGE_NAME}:${IMAGE_TAG}

          # Show that minikube now has the tag
          minikube -p minikube image list | grep -E "(^|/)${IMAGE_NAME}:${IMAGE_TAG}" || true
        '''
      }
    }


    stage("Deploy to Minikube") {
      steps {
        sh '''
          set -eux
          export KUBECONFIG=/tmp/kubeconfig-linux

          kubectl apply -f k8s/deployment.yaml
          kubectl apply -f k8s/service.yaml

          kubectl delete pod -l app=devops-app --force --grace-period=0 || true
          kubectl rollout restart deployment/devops-app
          kubectl rollout status deployment/devops-app --timeout=320s

          kubectl get pods -l app=devops-app -o wide

          echo "--- Dumping FULL index.html from running pod ---"
          POD=$(kubectl get pod -l app=devops-app -o jsonpath="{.items[0].metadata.name}")
          echo "Running pod: $POD"

          kubectl exec $POD -- sh -lc "echo '====== FULL index.html ======'"
          kubectl exec $POD -- sh -lc "cat public/index.html"
          kubectl exec $POD -- sh -lc "echo '====== END index.html ======'"

        '''
      }
    }
  }

  post {
    success {
      echo "CI/CD Pipeline SUCCESSFUL"
      emailext(
        to: 'nathanielchengyx@gmail.com',
        subject: "SUCCESS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        mimeType: 'text/html',
        body: """Build SUCCESS<br/>
Job: ${env.JOB_NAME}<br/>
Build: #${env.BUILD_NUMBER}<br/>
URL: ${env.BUILD_URL}<br/>"""
      )
    }

    failure {
      echo "Pipeline failed — check console logs"
      emailext(
        to: 'nathanielchengyx@gmail.com',
        subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
        mimeType: 'text/html',
        body: """Build FAILED<br/>
Job: ${env.JOB_NAME}<br/>
Build: #${env.BUILD_NUMBER}<br/>
URL: ${env.BUILD_URL}<br/>
Check Console Output for errors."""
      )
    }

    always {
      echo "Pipeline finished (success or failure)."
    }
  }
}