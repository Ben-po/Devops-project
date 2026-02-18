pipeline {
  agent any

  environment {
    IMAGE_NAME = "devops-app"
    IMAGE_TAG  = "1"
    KUBECONFIG = "/tmp/kubeconfig-linux"
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
          docker build --no-cache -t ${IMAGE_NAME}:${IMAGE_TAG} .
          minikube -p minikube image load ${IMAGE_NAME}:${IMAGE_TAG}
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

          # Force pods to restart so they use the refreshed :1 image
          kubectl rollout restart deployment/devops-app
          kubectl rollout status deployment/devops-app --timeout=180s

          kubectl get pods -l app=devops-app -o wide
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